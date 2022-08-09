import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import { User, Swipes } from '../types'
import * as refs from '../refs'
import algoliaService from '../services/algolia'
import yelpService from '../services/yelp'

/* ---------- FIRESTORE EVENT TRIGGERS ---------- */

/* ON UPDATE USER */

export const onUpdateUser = functions.firestore
  .document('/users/{uid}')
  .onUpdate(async (change, context) => {
    try {
      if (!change.before.isEqual(change.after)) {
        const oldData = change.before.data() as User
        const data = change.after.data() as User

        if (oldData.name !== data.name) {
          await admin.auth().updateUser(context.params.uid, {
            displayName: data.name,
          })
        }

        // Update Algolia user data
        await algoliaService.users.partialUpdateObject(
          {
            objectID: context.params.uid,
            ...data,
          },
          { createIfNotExists: true }
        )
      }
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })

/* ON SWIPE */

const checkForMatches = async (
  tx: admin.firestore.Transaction,
  partyId: string,
  memberIds: string[],
  swipes: Swipes,
  yelpId: string
) => {
  const superLikeMatch = memberIds.every(id => swipes[id]?.action === 'super-like')

  const likeMatch = memberIds.every(
    id => swipes[id]?.action === 'like' || swipes[id]?.action === 'super-like'
  )

  const dislikeMatch = memberIds.every(id => swipes[id]?.action === 'dislike')

  // TODO: notify party members when someone super-likes a business
  // const singleSuperLike = memberIds.some(
  //   id => swipes[id]?.action === 'super-like'
  // )

  if (superLikeMatch || likeMatch) {
    const { data: business } = await yelpService.getBusiness(yelpId)

    const lastToSwipe = Object.keys(swipes).reduce((a, b) =>
      swipes[a].timestamp.toMillis() > swipes[b].timestamp.toMillis() ? a : b
    )

    const matchesRef = refs.firestore.matches(partyId).doc()
    tx.set(
      matchesRef,
      {
        type: superLikeMatch ? 'super-like' : 'like',
        createdAt: admin.firestore.Timestamp.now(),
        members: memberIds,
        lastToSwipe,
        details: business,
      },
      { merge: true }
    )
  }

  if (superLikeMatch || likeMatch || dislikeMatch) {
    const swipesRef = refs.firestore.parties.doc(`${partyId}/swipes/${yelpId}`)
    tx.delete(swipesRef)
  }
}

export const onSwipe = functions.firestore
  .document('parties/{partyId}/swipes/{yelpId}')
  .onWrite(async (change, context) => {
    try {
      await admin.firestore().runTransaction(async tx => {
        const { partyId, yelpId } = context.params
        const memberIdsRef = refs.firestore.members.doc(partyId)
        const memberIdsSnapshot = await tx.get(memberIdsRef)
        const memberIds = Object.keys(memberIdsSnapshot.data() || {})

        if (change.after.exists && memberIds.length > 1) {
          const swipes = change.after.data() as Swipes
          await checkForMatches(tx, partyId, memberIds, swipes, yelpId)
        } else if (!change.after.exists) {
          console.log(`Party ${partyId}: swipes for ${yelpId} deleted!`)
        }
      })
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })

export const onChangeMembers = functions.firestore
  .document('members/{partyId}')
  .onUpdate(async (change, context) => {
    try {
      const data = change.after.data()
      if (data) {
        const memberIds = Object.keys(data)

        if (memberIds.length > 1) {
          await admin.firestore().runTransaction(async tx => {
            const { partyId } = context.params
            const swipesRef = refs.firestore.swipes(partyId)
            const swipesSnapshot = await tx.get(swipesRef)

            for (const doc of swipesSnapshot.docs) {
              const swipes = doc.data()
              await checkForMatches(tx, partyId, memberIds, swipes, doc.id)
            }
          })
        }
      }
    } catch (error) {
      functions.logger.log(error)
      console.log(error)
    }
  })
