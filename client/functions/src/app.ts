import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import algoliasearch from 'algoliasearch'

// Algolia
const client = algoliasearch(
  functions.config().algolia.id,
  functions.config().algolia.key
)

export const search = client.initIndex('dev_users')

export const yelp = {
  id: functions.config().yelp.client_id,
  token: functions.config().yelp.token,
}

// Firebase Admin
export const app = admin.initializeApp()

// Auth
export const auth = admin.auth()

// Storage
export const storage = admin.storage()

// Firestore
export const firestore = admin.firestore()

// Database
export const db = admin.database()
