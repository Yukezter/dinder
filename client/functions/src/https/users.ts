import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import { User } from '../types'
import * as refs from '../refs'
import * as validators from '../validators'
import { updateCustomUserClaims } from '../helpers/auth'

/* UPDATE USER */

type UpdateUserDto = {
  name?: NonNullable<User['name']>
  username?: NonNullable<User['username']>
  about?: string
}

export const updateUser = functions.https.onCall(
  async (_data: UpdateUserDto, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    const data = await validators.updateUser.validate(_data, {
      auth: context.auth,
    })

    console.log(_data, data)

    await admin.firestore().runTransaction(async tx => {
      // If username doc doesn't exist, the username is available so we update it
      if (data.username) {
        const usernameRef = refs.firestore.usernames.doc(data.username)

        // Delete any existing usernames that belong to this user
        const usernamesQuery = refs.firestore.usernames.where(
          'uid',
          '==',
          context.auth!.uid
        )
        const usernamesSnapshot = await tx.get(usernamesQuery)
        usernamesSnapshot.docs.forEach(doc => tx.delete(doc.ref))

        // Assign the new username to this user
        tx.create(usernameRef, { uid: context.auth!.uid })
      }

      // Update user
      const userRef = refs.firestore.users.doc(context.auth!.uid)
      tx.update(userRef, data)
    })

    if (context.auth.token.accessLevel === 0) {
      await updateCustomUserClaims(context.auth!.uid, {
        accessLevel: 1,
      })
    }
  }
)

/* ADD CONTACT */

export const addContact = functions.https.onCall(
  async (data: { id: string }, context) => {
    if (!context.auth || context.auth.token.accessLevel !== 1) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    if (context.auth.uid === data.id) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid user id')
    }

    await admin.firestore().runTransaction(async tx => {
      const usersRef = refs.firestore.users.doc(data.id)
      const usersSnapshot = await tx.get(usersRef)
      const contact = usersSnapshot.data()

      if (!contact) {
        throw new functions.https.HttpsError('not-found', 'No user found')
      }

      const contactsRef = refs.firestore.contacts.doc(context.auth!.uid)
      tx.set(contactsRef, { [data.id]: true }, { merge: true })
    })
  }
)

/* DELETE CONTACT */

export const deleteContact = functions.https.onCall(
  async (data: { id: string }, context) => {
    if (!context.auth || context.auth.token.accessLevel !== 1) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    if (context.auth.uid === data.id) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid user id')
    }

    await admin.firestore().runTransaction(async tx => {
      const contactsRef = refs.firestore.contacts.doc(context.auth!.uid)
      tx.update(contactsRef, { [data.id]: admin.firestore.FieldValue.delete() })
    })
  }
)

/* BLOCK CONTACT */

export const blockUser = functions.https.onCall(async (data: { id: string }, context) => {
  if (!context.auth || context.auth.token.accessLevel !== 1) {
    throw new functions.https.HttpsError('unauthenticated', 'Access denied')
  }

  if (context.auth.uid === data.id) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid user id')
  }

  await admin.firestore().runTransaction(async tx => {
    const userSnapshot = await tx.get(refs.firestore.users.doc(data.id))
    const user = userSnapshot.data()

    // Ensure user exists
    if (!user) {
      throw new functions.https.HttpsError('not-found', 'No user found')
    }

    // Remove contact from this user's parties and remove this user from contact's parties
    const partiesQuery = refs.firestore.parties.where('members', 'array-contains', [
      context.auth!.uid,
      user.uid,
    ])
    const partiesSnapshot = await tx.get(partiesQuery)
    partiesSnapshot.forEach(partyDoc => {
      const party = partyDoc.data()
      if (party.admin === context.auth!.uid) {
        tx.update(partyDoc.ref, {
          members: admin.firestore.FieldValue.arrayRemove(user.uid),
        })
      } else if (party.admin === user.uid) {
        tx.update(partyDoc.ref, {
          members: admin.firestore.FieldValue.arrayRemove(context.auth!.uid),
        })
      }
    })

    // Block this user
    const contactsRef = refs.firestore.contacts.doc(context.auth!.uid)
    tx.set(contactsRef, { [data.id]: false }, { merge: true })
  })
})
