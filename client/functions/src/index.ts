import * as admin from 'firebase-admin'

admin.initializeApp()

export * from './triggers/auth'
export * from './triggers/database'
export * from './triggers/firestore'
export * from './triggers/storage'
export * from './https/users'
export * from './https/parties'

import * as seed from './scripts/seed'
export const emulatorFunctions = process.env.FUNCTIONS_EMULATOR ? seed : undefined
