import {
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  PhoneAuthProvider,
  signOut,
  RecaptchaVerifier,
  Persistence,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  updatePassword,
  updateEmail,
  updatePhoneNumber,
} from 'firebase/auth'

import { auth } from '../firebase'

const persistenceTypes = {
  // LOCAL: indexedDBLocalPersistence,
  LOCAL: browserLocalPersistence,
  SESSION: browserSessionPersistence,
  NONE: inMemoryPersistence,
}

export class AuthService {
  static setPersistence(type: Persistence['type']) {
    return setPersistence(auth, persistenceTypes[type])
  }

  static async signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  static signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  static signInWithCustomToken(token: string) {
    return signInWithCustomToken(auth, token)
  }

  static signOut() {
    return signOut(auth)
  }

  static updateEmail(newEmail: string) {
    return updateEmail(auth.currentUser!, newEmail)
  }

  static updatePassword(newPassword: string) {
    return updatePassword(auth.currentUser!, newPassword)
  }

  static createRecaptchaVerifier(container: HTMLElement) {
    const options = { size: 'invisible', theme: 'dark' }
    return new RecaptchaVerifier(container, options, auth)
  }

  static verifyPhoneNumber(phoneNumber: string, appVerifier: RecaptchaVerifier) {
    const provider = new PhoneAuthProvider(auth)
    return provider.verifyPhoneNumber(phoneNumber, appVerifier)
  }

  static updatePhoneNumber(verificationId: string, code: string) {
    const credential = PhoneAuthProvider.credential(verificationId, code)
    return updatePhoneNumber(auth.currentUser!, credential)
  }
}
