import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import * as refs from '../refs'
import { updateCustomUserClaims } from '../helpers/auth'
import algoliaService from '../services/algolia'

/* ---------- AUTH EVENT TRIGGERS ---------- */

/* ON CREATE USER */

export const onCreateUser = functions.auth.user().onCreate(async user => {
  try {
    // a Firestore user account with default settings will be created along with
    // an access level of '0' until the user has met the registration requirements
    await refs.firestore.users.doc(user.uid).create({
      uid: user.uid,
      photoURL: user.photoURL || null,
      name: user.displayName || null,
      username: null,
      about: null,
    })

    await updateCustomUserClaims(user.uid, { accessLevel: 0 })
  } catch (error) {
    functions.logger.log(error)
    console.log(error)
  }
})

/* ON DELETE USER */

export const onDeleteUser = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .auth.user()
  .onDelete(async user => {
    try {
      // Delete realtime database data related to this user
      await admin
        .database()
        .ref()
        .root.update({
          [`metadata/${user.uid}`]: null,
          [`status/${user.uid}`]: null,
          [`users/${user.uid}`]: null,
        })

      // Delete firestore data related to this user
      await admin.firestore().runTransaction(async tx => {
        // Get username(s) that belong to this user
        const usernamesQuery = refs.firestore.usernames.where('uid', '==', user.uid)
        const usernamesSnapshot = await tx.get(usernamesQuery)
        // Get contacts lists that include this user
        const contactsQuery = refs.firestore.contacts.orderBy(user.uid)
        const contactsSnapshot = await tx.get(contactsQuery)
        // Get parties that this user is a admin OR member of
        const partiesQuery = refs.firestore.parties.where(
          'members',
          'array-contains',
          user.uid
        )
        const partiesSnapshot = await tx.get(partiesQuery)
        // Get swipe docs from all parties
        // const swipesSnapshots = await Promise.all(partiesSnapshot.docs.map(partyDoc => {
        //   const swipesQuery = swipes(partyDoc.id).orderBy(user.uid)
        //   return tx.get(swipesQuery)
        // }))

        // Delete usernames that belong to this user
        usernamesSnapshot.forEach(doc => tx.delete(doc.ref))

        // Delete user doc
        tx.delete(refs.firestore.users.doc(user.uid))

        // Delete contacts
        tx.delete(refs.firestore.contacts.doc(user.uid))
        // Delete this user from any contact lists this user is in
        contactsSnapshot.forEach(doc =>
          tx.update(doc.ref, {
            [user.uid]: admin.firestore.FieldValue.delete(),
          })
        )

        // Delete all parties owned by this user and also remove
        // this user from all parties they're a member of
        partiesSnapshot.docs.forEach(partyDoc => {
          const party = partyDoc.data()

          // swipesSnapshots[index].docs.forEach(swipesDoc => {
          //   tx.set(swipesDoc.ref, {
          //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
          //     [user.uid]: admin.firestore.FieldValue.delete() as any,
          //   }, { merge: true })
          // })

          if (user.uid === party.admin) {
            tx.delete(partyDoc.ref)
          } else {
            tx.update(partyDoc.ref, {
              members: admin.firestore.FieldValue.arrayRemove(user.uid),
            })
          }
        })
      })

      // Delete Algolia user object
      await algoliaService.users.deleteObject(user.uid)
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })
