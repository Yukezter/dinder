import { auth } from '../firebase'

export const getCurrentUser = () => {
  if (!auth.currentUser) {
    throw Error('No user is signed in!')
  }

  return auth.currentUser
}
