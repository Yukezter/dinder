import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCwuAxZYzXjubGnXKaXTepkqDkf7qgUT3o',
  authDomain: 'dinder-33ca6.firebaseapp.com',
  projectId: 'dinder-33ca6',
  storageBucket: 'dinder-33ca6.appspot.com',
  messagingSenderId: '1085150274002',
  appId: '1:1085150274002:web:af00b7125dbeb15393e80b',
  measurementId: 'G-CFDJC3P4P7',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
export const firestore = getFirestore(app)
export const functions = getFunctions(app)
export const storage = getStorage(app)
export const analytics = getAnalytics(app)

if (global.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectDatabaseEmulator(db, 'localhost', 9000)
  connectFirestoreEmulator(firestore, 'localhost', 8080)
  connectFunctionsEmulator(functions, 'localhost', 5001)
  connectStorageEmulator(storage, 'localhost', 9199)
}
