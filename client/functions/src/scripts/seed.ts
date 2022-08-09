import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { faker } from '@faker-js/faker'

import { User } from '../types'
import * as refs from '../refs'
import algoliaService from '../services/algolia'

type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

type MockUser = RequiredNotNull<User>

const createFakeUser = (): MockUser => {
  const name = faker.name.findName()
  return {
    uid: faker.datatype.uuid(),
    photoURL: faker.image.people(640, 480, true),
    name,
    username: faker.unique(() => faker.internet.userName(name)),
    about: faker.lorem.paragraphs(2),
  }
}

export const seedUsers = functions.https.onCall(async (data: number) => {
  const existingUsers = await admin.auth().listUsers()
  await admin.auth().deleteUsers(existingUsers.users.map(({ uid }) => uid))

  const users = Array.from(Array(data)).map(createFakeUser)
  await admin.auth().importUsers(
    users.map(({ uid, name }) => ({
      uid,
      email: faker.unique(() => faker.internet.email(name)),
      customClaims: { accessLevel: 1 },
    }))
  )

  const result = await admin.auth().listUsers()
  await Promise.all(
    result.users.map(({ uid }) =>
      admin.auth().updateUser(uid, {
        password: '123123',
      })
    )
  )

  const batch = admin.firestore().batch()
  users.forEach(user => {
    const userRef = refs.firestore.users.doc(user.uid)
    batch.create(userRef, user)
  })

  await batch.commit()

  await algoliaService.users.clearObjects()
  await algoliaService.users.saveObjects(
    users.map(user => ({ objectID: user.uid, ...user }))
  )
})
