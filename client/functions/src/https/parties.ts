import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const firebase_tools = require('firebase-tools')

import { Party, Members, Offsets } from '../types'
import * as refs from '../refs'
import * as validators from '../validators'
import yelpService from '../services/yelp'
import { isEqual } from '../utils/utils'

/* CREATE PARTY */

type UpdatePartyDto = Pick<Party, 'id' | 'name' | 'members' | 'location' | 'params'>

export const updateParty = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onCall(async (_data: UpdatePartyDto, context) => {
    if (!context.auth || context.auth.token.accessLevel !== 1) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    if (!_data.members.includes(context.auth.uid)) {
      _data.members.push(context.auth.uid)
    }

    const data = await validators.updateParty.validate(_data, { auth: context.auth })

    return admin.firestore().runTransaction(async tx => {
      const partyRef = refs.firestore.parties.doc(data.id)
      const partySnapshot = await tx.get(partyRef)
      const party = partySnapshot.data()

      // Ensure only the party admin can make changes
      if (party && party.admin !== context.auth!.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Access denied')
      }

      const membersQuery = refs.firestore.users.where(
        admin.firestore.FieldPath.documentId(),
        'in',
        data.members
      )

      // Filter out invalid party members
      const membersSnapshot = await tx.get(membersQuery)
      const membersDocs = membersSnapshot.docs.filter(doc => doc.exists)
      data.members = membersDocs.map(doc => doc.id)
      const users = membersDocs.map(doc => doc.data())

      // Filter out any members that have blocked this user
      const contactsQuery = refs.firestore.contacts.where(
        admin.firestore.FieldPath.documentId(),
        'in',
        data.members
      )

      const contactsSnapshot = await tx.get(contactsQuery)
      data.members = data.members.filter(id => {
        const member = contactsSnapshot.docs.find(doc => doc.id === id)
        return member?.data()[context.auth!.uid] !== false
      })

      // Create members document for fast party member reads
      const membersRef = refs.firestore.members.doc(partyRef.id)
      tx.set(
        membersRef,
        data.members.reduce<Members>((ids, id) => ((ids[id] = true), ids), {})
      )

      if (!party) {
        // Create party
        const newParty = {
          ...data,
          admin: context.auth!.token.uid,
          active: false,
          createdAt: admin.firestore.Timestamp.now(),
          lastActive: admin.firestore.Timestamp.now(),
        }

        tx.create(partyRef, newParty)

        return { ...newParty, members: users }
      } else {
        // Update party
        const newParty = {
          ...party,
          ...data,
          lastActive: admin.firestore.Timestamp.now(),
        }

        tx.set(partyRef, newParty, { merge: true })

        // Reset party member offsets if any Yelp search params for party have changed
        if (!isEqual(party, data, ['location', 'params'])) {
          console.log('Party params changed!')
          const offsetsRef = refs.firestore.offsets.doc(party.id)
          tx.set(
            offsetsRef,
            party.members.reduce((obj: Offsets, id: string) => ((obj[id] = 0), obj), {})
          )
        }

        return { ...newParty, members: users }
      }
    })
  })

/* LEAVE PARTY */

type LeavePartyDto = { partyId: string }

export const leaveParty = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .https.onCall(async (data: LeavePartyDto, context) => {
    if (!context.auth || context.auth.token.accessLevel !== 1) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    await admin.firestore().runTransaction(async tx => {
      const partyRef = refs.firestore.parties.doc(data.partyId)
      const partySnapshot = await tx.get(partyRef)
      const party = partySnapshot.data()

      if (!party) {
        throw new functions.https.HttpsError('not-found', 'No party found')
      }

      const membersRef = refs.firestore.members.doc(party.id)
      const offsetsRef = refs.firestore.offsets.doc(party.id)
      // Delete all party related data if admin leaves
      if (context.auth!.uid === party.admin) {
        // Recusively delete the party document's subcollections
        await firebase_tools.firestore.delete(`parties/${party.id}`, {
          project: process.env.GCLOUD_PROJECT,
          recursive: true,
          yes: true,
          token: functions.config().admin.token(),
          force: true,
        })

        tx.delete(partyRef)
        tx.delete(membersRef)
        tx.delete(offsetsRef)
      } else {
        tx.update(membersRef, {
          [context.auth!.uid]: admin.firestore.FieldValue.delete(),
        })

        tx.update(partyRef, {
          members: admin.firestore.FieldValue.arrayRemove(context.auth!.uid),
        })
      }
    })
  })

/* YELP BUSINESSES ENDPOINT */

const milesToMeters = (miles: number) => miles * 1609

type GetYelpBusinessesDto = Party['location'] & Party['params'] & { offset: number }

export const getYelpBusinesses = functions.https.onCall(
  async (_data: GetYelpBusinessesDto, context) => {
    if (!context.auth || context.auth.token.accessLevel !== 1) {
      throw new functions.https.HttpsError('unauthenticated', 'Access denied')
    }

    const data = await validators.getYelpBusinesses.validate(_data)

    const meters = milesToMeters(data.radius)
    const radius = meters > 40000 ? 17000 : meters
    // prettier-ignore
    const categories = data.categories.length > 0
      ? data.categories.join(',')
      : 'food,restaurants'

    const params = {
      ...data,
      categories,
      radius,
      limit: data.offset > 980 ? 1000 - data.offset : 20,
      term: 'food',
    }

    console.log(params)

    const res = await yelpService.searchBusinesses({ params })

    console.log(res.data.total)

    return {
      ...res.data,
      total: res.data.total > 1000 ? 1000 : res.data.total,
    }
  }
)
