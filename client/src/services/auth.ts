import {
  setPersistence,
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

import api from '../app/api'
import { auth } from '../app/firebase'

const persistenceTypes = {
  LOCAL: browserLocalPersistence,
  SESSION: browserSessionPersistence,
  NONE: inMemoryPersistence,
}

class AuthService {
  async setPersistence(type: Persistence['type']) {
    return setPersistence(auth, persistenceTypes[type])
  }

  async signUp(data: any) {
    const res = await api.cloud.post<{ result: string }>('/signUp', { data })
    return res.data.result
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
    // return createUserWithEmailAndPassword(auth, email, password)
  }

  signInWithCustomToken(token: string) {
    return signInWithCustomToken(auth, token)
  }

  signOut() {
    return signOut(auth)
  }

  updateEmail(newEmail: string) {
    return updateEmail(auth.currentUser!, newEmail)
  }

  updatePassword(newPassword: string) {
    return updatePassword(auth.currentUser!, newPassword)
  }

  createRecaptchaVerifier(container: HTMLElement) {
    const options = { size: 'invisible', theme: 'dark' }
    return new RecaptchaVerifier(container, options, auth)
  }

  verifyPhoneNumber(phoneNumber: string, appVerifier: RecaptchaVerifier) {
    const provider = new PhoneAuthProvider(auth)
    return provider.verifyPhoneNumber(phoneNumber, appVerifier)
  }

  updatePhoneNumber(verificationId: string, code: string) {
    const credential = PhoneAuthProvider.credential(verificationId, code)
    return updatePhoneNumber(auth.currentUser!, credential)
  }
}

export default new AuthService()

// signInWithGoogle() {
//   const googleAuthProvider = new GoogleAuthProvider()
//   return signInWithRedirect(auth, googleAuthProvider)
// }

// signInWithTwitter() {
//   const twitterAuthProvider = new TwitterAuthProvider()
//   return signInWithRedirect(auth, twitterAuthProvider)
// }
