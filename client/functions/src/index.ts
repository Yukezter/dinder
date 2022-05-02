/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as functions from 'firebase-functions'
import { UserRecord } from 'firebase-functions/v1/auth'
import { FieldPath, FieldValue, Timestamp } from 'firebase-admin/firestore'
import axios from 'axios'
import { ValidateOption } from 'async-validator'
import { AsyncValidationError } from 'async-validator/dist-types/util'

import { auth, firestore, db, storage, search, yelp } from './app'
import { converter } from './util'
import validators from './validators'

const yelpAPI = axios.create({
  baseURL: 'https://api.yelp.com/v3',
  headers: {
    Authorization: `Bearer ${yelp.token}`,
  },
})

// eslint-disable-next-line camelcase
// const firebase_tools = require('firebase-tools')

// Username used as doc id to ensure uniqueness
interface Username {
  uid: string
}

// Public user information
interface User {
  uid: string
  photoURL: string
  name: string
  username: string
  about: string
}

// Party information
interface Party {
  id: string
  name: string
  admin: string
  members: string[]
  active: boolean
  location: {
    place_id: string
    description: string
    latitude: number
    longitude: number
  }
  params: {
    radius: number
    price: number
    categories: string[]
    open_now?: boolean
  }
  lastActive: Timestamp
  createdAt: Timestamp
}

type Members = { [userId: string]: true }

// Business (saved or blocked)
interface Business {
  id: string
  type: 'save' | 'block'
  createdAt: Timestamp
  details: {
    image: string
    name: string
    price: string
    rating: number
    categories: string
    reviews: number
    location: string
    url: string
  }
}

// This keeps track of the swipe choices for a business
// If the doc contains all party member user ids, it's a match
interface Swipes {
  [userId: string]: {
    action: 'dislike' | 'like' | 'super-like'
    timestamp: Timestamp
  }
}

type Match = {
  id: string
  type: 'like' | 'super-like'
  createdAt: Timestamp
  details: Business['details']
  lastToSwipe: string
}

// // Party session match history
// interface Matches {
//   [yelpId: string]: Business
// }

const usernames = firestore
  .collection('usernames')
  .withConverter(converter<Username>())

const users = firestore.collection('users').withConverter(converter<User>())

const contacts = firestore
  .collection('contacts')
  .withConverter(converter<{ [userId: string]: boolean }>())

const userParties = firestore
  .collection('user_parties')
  .withConverter(converter<{ userId: true }>())

const parties = firestore
  .collection('parties')
  .withConverter(converter<Party>())

const members = firestore
  .collection('members')
  .withConverter(converter<Members>())

const matches = (partyId: string) =>
  firestore
    .collection(`parties/${partyId}/matches`)
    .withConverter(converter<Match>())

// const swipes = firestore.collection('swipes').withConverter(converter<Swipes>())

/* ---------- HELPER FUNCTIONS ---------- */

const defaultPhotoURL = 'https://cdn-icons-png.flaticon.com/512/61/61205.png'

const createUser = async (user: UserRecord, batch = firestore.batch()) => {
  const { uid } = user
  const photoURL = user.photoURL || defaultPhotoURL
  const name = user.displayName || ''
  const username = ''
  const about = ''

  batch.create(users.doc(uid), {
    uid,
    photoURL,
    name,
    username,
    about,
  })

  await batch.commit()

  await search
    .partialUpdateObject({
      objectID: uid,
      photoURL,
      name,
      username,
      about,
    })
    .wait()
}

type CustomUserClaims = {
  accessLevel: 0 | 1
}

const updateCustomUserClaims = async (uid: string, data: CustomUserClaims) => {
  await auth.setCustomUserClaims(uid, data)

  // Update user metadata refresh time
  const userMetadataRef = db.ref('metadata').child(uid)
  await userMetadataRef.set({ refreshTime: new Date().getTime() })
}

/* ---------- AUTH EVENT TRIGGERS ---------- */

/* ON CREATE USER */

export const onCreateUser = functions.auth.user().onCreate(async user => {
  // In case the custom signIn isn't used, a Firestore user account with default
  // settings will be created with an access level of '0' until the user has met
  // the registration requirements.
  await createUser(user)

  await updateCustomUserClaims(user.uid, {
    accessLevel: 0,
  })
})

/* ON DELETE USER */

export const onDeleteUser = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB',
  })
  .auth.user()
  .onDelete(async user => {
    const { uid } = user

    try {
      // Delete database data related to this user
      await db.ref().root.update({
        [`metadata/${uid}`]: null,
        [`status/${uid}`]: null,
        [`users/${uid}`]: null,
      })

      // Delete all firestore data related to this user
      await firestore.runTransaction(async tx => {
        // Get all usernames that belong to this user
        const usernamesQuery = usernames.where('uid', '==', uid)
        const usernamesSnapshot = await tx.get(usernamesQuery)
        // Get all contacts lists that include this user
        const contactsQuery = contacts.orderBy(uid)
        const contactsSnapshot = await tx.get(contactsQuery)
        // Get all parties that this user is a member of
        const partiesQuery = parties.where('members', 'array-contains', uid)
        const partiesSnapshot = await tx.get(partiesQuery)

        // Delete any usernames that belong to this user
        usernamesSnapshot.forEach(doc => tx.delete(doc.ref))

        tx.delete(users.doc(uid))
        tx.delete(contacts.doc(uid))

        // Delete this user from any contacts lists this user is in
        contactsSnapshot.forEach(doc => tx.delete(doc.ref))

        // Update parties
        partiesSnapshot.forEach(partyDoc => {
          const partyRef = partyDoc.ref
          const party = partyDoc.data()

          if (uid === party.admin) {
            // Delete any parties owned by this user
            tx.delete(partyRef)
          } else {
            // Otherwise, remove user as party member
            tx.update(partyRef, {
              members: FieldValue.arrayRemove(uid),
            })
          }
        })
      })

      // Delete Algolia user
      await search.deleteObject(uid)
    } catch (error) {
      console.log(error)
    }

    // Delete cloud firestore user data
    // await firebase_tools.firestore.delete(`users/${uid}`, {
    //   project: process.env.GCLOUD_PROJECT,
    //   recursive: true,
    //   yes: true,
    //   token: functions.config().fb.token,
    // })
  })

/* ---------- DATABASE EVENT TRIGGERS ---------- */

/* ON UPDATE USER LAST ONLINE */

export const onUpdateLastOnline = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/users/{uid}/lastOnline')
  .onWrite(async (change, context) => {
    try {
      if (!change.after.exists()) {
        return null
      }

      console.log('onUpdateLastOnline')
      console.log('User:', context.auth?.uid)

      await firestore.doc(`/status/${context.params.uid}`).set(
        {
          lastOnline: new Date(change.after.val()),
        },
        { merge: true }
      )
    } catch (error) {
      console.log(error)
      return error
    }
  })

/* ON DELETE USER CONNECTIONS */

export const onDeleteUserStatus = functions.database
  .instance('dinder-33ca6-default-rtdb')
  .ref('/users/{uid}/connections')
  .onDelete(async (change, context) => {
    try {
      console.log('onDeleteUserStatus')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log('User:', context.auth?.uid)

      await firestore.doc(`status/${context.params.uid}`).set(
        {
          state: 'offline',
        },
        { merge: true }
      )
    } catch (error) {
      console.log(error)
      return error
    }
  })

/* ---------- FIRESTORE EVENT TRIGGERS ---------- */

/* ON UPDATE USER */

export const onUpdateUser = functions.firestore
  .document('/users/{uid}')
  .onUpdate(async (change, context) => {
    const { uid } = context.params
    // const oldData = change.before.data() as User
    const newData = change.after.data() as User

    if (!change.before.isEqual(change.after)) {
      // Update Algolia user data
      await search.partialUpdateObject({
        objectID: uid,
        photoURL: newData.photoURL,
        name: newData.name,
        username: newData.username,
        about: newData.about,
      })
    }

    console.log(change.before.isEqual(change.after))
    console.log(newData)
  })

/* ---------- STORAGE EVENT TRIGGERS ---------- */

/* ON FILE UPLOAD */

export const onFileUpload = functions.storage
  .object()
  .onFinalize(async object => {
    const { contentType, name } = object

    console.log(object)

    if (!contentType?.startsWith('image/')) {
      return functions.logger.log('This is not an image.')
    }

    if (!name?.endsWith('profilePhoto')) {
      return functions.logger.log('This is not valid file name.')
    }

    if (process.env.FUNCTIONS_EMULATOR) {
      const [pathExists] = await storage.bucket().file(name!).exists()
      if (!pathExists) {
        return functions.logger.log('File not found in storage.')
      }
    }

    const uid = object.name!.split('/')[1]
    users.doc(uid).update({
      photoURL: object.mediaLink,
    })
  })

/* ON FILE DELETE */

export const onFileDelete = functions.storage
  .object()
  .onDelete(async object => {
    const { contentType, name } = object

    console.log(object)

    if (!contentType?.startsWith('image/')) {
      return functions.logger.log('This is not an image.')
    }

    if (!name?.endsWith('profilePhoto')) {
      return functions.logger.log('This is not valid file name.')
    }

    const uid = object.name!.split('/')[1]
    users.doc(uid).update({
      photoURL: defaultPhotoURL,
    })
  })

/* ON SWIPE */

export const onSwipe = functions.firestore
  .document('parties/{partyId}/swipes/{yelpId}')
  .onWrite(async (change, context) => {
    try {
      await firestore.runTransaction(async tx => {
        const { partyId, yelpId } = context.params
        const memberIdsRef = members.doc(partyId)
        const memberIdsSnapshot = await tx.get(memberIdsRef)
        const memberIds = Object.keys(memberIdsSnapshot.data() || {})

        console.log(memberIds)

        const swipes = change.after.data() as Swipes | undefined

        if (swipes) {
          const superLikeMatch = memberIds.every(
            id => swipes[id]?.action === 'super-like'
          )

          const likeMatch = memberIds.every(
            id =>
              swipes[id]?.action === 'like' ||
              swipes[id]?.action === 'super-like'
          )

          const dislikeMatch = memberIds.every(
            id => swipes[id]?.action === 'dislike'
          )

          // const singleSuperLike = memberIds.some(
          //   id => swipes[id]?.action === 'super-like'
          // )

          if (superLikeMatch || likeMatch) {
            const res = await yelpAPI.get(`/businesses/${yelpId}`)
            const business = res.data
            const details: Business['details'] = {
              image: business.image_url,
              name: business.name,
              price: business.price,
              rating: business.rating,
              reviews: business.review_count,
              categories: business.categories
                .map(({ title }: { title: string }) => title)
                .join(', '),
              location:
                `${business.location.city}, ${business.location.state}`.concat(
                  `, ${business.location.country}`
                ),
              url: business.url,
            }

            const lastToSwipe = Object.keys(swipes).reduce((a, b) =>
              swipes[a].timestamp.toMillis() > swipes[b].timestamp.toMillis()
                ? a
                : b
            )

            const matchesRef = matches(partyId).doc()
            tx.set(
              matchesRef,
              {
                id: business.id,
                type: superLikeMatch ? 'super-like' : 'like',
                createdAt: Timestamp.now(),
                details,
                lastToSwipe,
              },
              { merge: true }
            )
          }

          if (superLikeMatch || likeMatch || dislikeMatch) {
            const swipesRef = parties.doc(`${partyId}/swipes/${yelpId}`)
            tx.delete(swipesRef)
          }
        } else {
          console.log(`Party ${partyId}: swipes for ${yelpId} deleted!`)
        }
      })
    } catch (error) {
      console.log(error)
    }
  })

/* ---------- CLOUD FUNCTIONS ---------- */

/* SIGN UP */

type SignUpDto = {
  name?: string
  username?: string
  email?: string
  password?: string
}

export const signUp = functions.https.onCall(async (data: SignUpDto) => {
  try {
    await validators.signUp.validate(data, { firstFields: true })
  } catch (e) {
    const validationError = e as AsyncValidationError
    throw new functions.https.HttpsError(
      'invalid-argument',
      validationError.message,
      validationError.errors
    )
  }

  try {
    const user = await auth.createUser({
      displayName: data.name,
      email: data.email,
      password: data.password,
    })

    const { uid } = user

    const usernameRef = usernames.doc(data.username!)
    const batch = firestore.batch()
    batch.create(usernameRef, { uid })
    await createUser(user, batch)

    await updateCustomUserClaims(uid, {
      accessLevel: 1,
    })

    return auth.createCustomToken(uid)
  } catch (error) {
    console.log(error)
    throw new functions.https.HttpsError('internal', 'Something went wrong...')
  }
})

/* UPDATE USER */

export const updateUser = functions.https.onCall(
  async (data: Pick<User, 'name' | 'username' | 'about'>, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    try {
      const result = await validators.updateUser.validate(data, {
        firstFields: true,
        uid,
      } as ValidateOption)

      console.log(JSON.stringify(result, null, 2))
    } catch (e) {
      const validationError = e as AsyncValidationError
      throw new functions.https.HttpsError(
        'invalid-argument',
        validationError.message,
        validationError.errors
      )
    }

    await firestore.runTransaction(
      async tx => {
        // Delete any existing usernames that belong to this user
        const usernamesQuery = usernames.where('uid', '==', uid)
        const usernamesSnapshot = await tx.get(usernamesQuery)
        usernamesSnapshot.docs.forEach(doc => tx.delete(doc.ref))

        // Assign the new username to this user
        const usernameRef = usernames.doc(data.username!)
        tx.create(usernameRef, { uid })

        // Update user
        tx.update(users.doc(uid), data)
      },
      {
        maxAttempts: 3,
      }
    )

    if (context.auth.token.accessLevel === 0) {
      await updateCustomUserClaims(uid, {
        accessLevel: 1,
      })
    }

    return true
  }
)

/* ADD CONTACT */

type AddContactDto = {
  contactId: string
}

export const addContact = functions.https.onCall(
  async (data: AddContactDto, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    if (uid === data.contactId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid user id'
      )
    }

    try {
      await firestore.runTransaction(async tx => {
        const contactSnapshot = await tx.get(users.doc(data.contactId))
        const contact = contactSnapshot.data()

        if (!contact) {
          throw new functions.https.HttpsError('not-found', 'No user found')
        }

        tx.set(contacts.doc(uid), { [data.contactId]: true }, { merge: true })
      })
    } catch (error) {
      console.log(error)
      return error
    }
  }
)

type DeleteContactDto = {
  contactId: string
}

/* DELETE CONTACT */

export const deleteContact = functions.https.onCall(
  async (data: DeleteContactDto, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    if (uid === data.contactId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid user id'
      )
    }

    try {
      await contacts.doc(uid).update({
        [data.contactId]: FieldValue.delete(),
      })
    } catch (error) {
      console.log(error)
    }
  }
)

/* BLOCK CONTACT */

export const blockContact = functions.https.onCall(
  async (data: DeleteContactDto, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    if (uid === data.contactId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid user id'
      )
    }

    firestore.runTransaction(async tx => {
      try {
        const contactSnapshot = await tx.get(users.doc(data.contactId))
        const contact = contactSnapshot.data()

        // Ensure contact exists
        if (!contact) {
          throw new functions.https.HttpsError('not-found', 'No user found')
        }

        const partiesQuery = parties.where('members', 'array-contains', uid)
        const partiesSnapshot = await tx.get(partiesQuery)

        // Remove contact from this user's parties
        // and remove this user from contact's parties
        partiesSnapshot.forEach(partyDoc => {
          const party = partyDoc.data()
          if (party.admin === uid) {
            tx.update(partyDoc.ref, {
              members: FieldValue.arrayRemove(contact.uid),
            })
          } else {
            tx.update(partyDoc.ref, {
              members: FieldValue.arrayRemove(uid),
            })
          }
        })

        tx.update(contacts.doc(uid), {
          [data.contactId]: false,
        })
      } catch (error) {
        console.log(error)
      }
    })
  }
)

/* CREATE PARTY */

type UpdatePartyDto = Party

export const updateParty = functions.https.onCall(
  async (data: UpdatePartyDto, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    // Make sure authenticated user is party admin
    if (uid !== data.admin) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    console.log(data)

    try {
      await validators.updateParty.validate(data, { firstFields: true })
    } catch (e) {
      const validationError = e as AsyncValidationError
      throw new functions.https.HttpsError(
        'invalid-argument',
        validationError.message,
        validationError.errors
      )
    }

    await firestore.runTransaction(async tx => {
      // Validate all party members
      const membersQuery = users.where(
        FieldPath.documentId(),
        'in',
        data.members
      )

      const membersSnapshot = await tx.get(membersQuery)
      let memberIds = membersSnapshot.docs.map(doc => {
        if (!doc.exists) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid member id'
          )
        }

        return doc.id
      })

      // Filter out any members that have blocked this user
      const contactsQuery = contacts.where(
        FieldPath.documentId(),
        'in',
        memberIds
      )

      const contactsSnapshot = await tx.get(contactsQuery)
      memberIds = memberIds.filter(memberId => {
        const member = contactsSnapshot.docs.find(doc => doc.id === memberId)
        return member?.data()[uid] !== false
      })

      // Create the party
      const partyRef = parties.doc(data.id)
      tx.set(
        partyRef,
        {
          ...data,
          createdAt: new Timestamp(
            data.createdAt.seconds,
            data.createdAt.nanoseconds
          ),
          lastActive: new Timestamp(
            data.lastActive.seconds,
            data.lastActive.nanoseconds
          ),
        },
        { merge: true }
      )

      // Create members document for fast members reads
      const membersRef = members.doc(partyRef.id)

      tx.set(
        membersRef,
        memberIds.reduce<Members>((acc, id) => {
          acc[id] = true
          return acc
        }, {})
      )

      // Finally, add party id to each member's parties object
      memberIds.forEach(memberId => {
        // TODO: remove a user's userParty if they aren't in this member id's list
        const userPartyRef = userParties.doc(memberId)
        tx.set(
          userPartyRef,
          {
            [partyRef.id]: true,
          },
          { merge: true }
        )
      })
    })
  }
)

/* DELETE PARTY */

type DeletePartyDto = {
  partyId: string
}

export const deleteParty = functions.https.onCall(
  async (data: DeletePartyDto, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    const { uid } = context.auth

    const partyRef = parties.doc(data.partyId)
    const partySnapshot = await partyRef.get()
    const party = partySnapshot.data()

    if (!party) {
      throw new functions.https.HttpsError('not-found', 'No user found')
    }

    // Make sure authenticated user is party admin
    if (uid !== party.admin) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    try {
      await firestore.runTransaction(async tx => {
        // Delete party
        tx.delete(partyRef)
      })
    } catch (error) {
      console.log(error)
    }
  }
)

const milesToMeters = (miles: number) => miles * 1609

export const getYelpBusinesses = functions.https.onCall(
  async (data: Party['params'] & Party['location'], context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Unauthenticated')
    }

    if (!data || !data.description || !data.latitude || !data.longitude) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'No options provided!'
      )
    }

    try {
      const meters = milesToMeters(data.radius)
      const radius = meters > 40000 ? 17000 : meters
      const categories =
        data.categories.length > 0
          ? data.categories.join(',')
          : 'food,restaurants'

      const params = {
        offset: 0,
        ...data,
        categories,
        radius,
        limit: 20,
        // term: 'food',
        // open_now: true,
      }

      console.log(params)

      const res = await yelpAPI.get('/businesses/search', {
        params,
      })

      console.log(res.data.total)

      return res.data
    } catch (error) {
      console.log(error)
    }
  }
)

// export const onUserStatusChanged = functions.database
//   .instance('dinder-33ca6-default-rtdb')
//   .ref('/status/{uid}')
//   .onUpdate(async (change, context) => {
//     const eventStatus = change.after.val()

//     const userStatusFirestoreRef = firestore.doc(`status/${context.params.uid}`)

//     const statusSnapshot = await change.after.ref.once('value')
//     const status = statusSnapshot.val()
//     functions.logger.log(status, eventStatus)

//     if (status.last_changed > eventStatus.last_changed) {
//       return null
//     }

//     eventStatus.last_changed = new Date(eventStatus.last_changed)

//     return userStatusFirestoreRef.set(eventStatus)
//   })

// export const onWriteUserStatus = functions.database
//   .instance('dinder-33ca6-default-rtdb')
//   .ref('/users/{uid}/connections')
//   .onWrite(async (change, context) => {
//     try {
//       const userStatusFirestoreRef = firestore.doc(
//         `status/${context.params.uid}`
//       )

//       if (!change.after.exists()) {
//         return userStatusFirestoreRef.set({
//           state: 'offline',
//         })
//       }

//       if (!change.before.exists()) {
//         return userStatusFirestoreRef.set({
//           state: 'online',
//         })
//       }
//     } catch (error) {
//       console.log(error)
//       return error
//     }
//   })
