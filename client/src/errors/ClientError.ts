import { AuthErrorCodes } from 'firebase/auth'

type Code = typeof AuthErrorCodes[keyof typeof AuthErrorCodes]

type CustomErrorMap = {
  [K in Code]: string
}

// prettier-ignore
const CustomErrorCodes: Partial<CustomErrorMap> = {
  'auth/internal-error': 'An internal error has occurred.',
  'auth/too-many-requests': 'We have blocked all requests from this device due to unusual activity. Try again later.',
  'auth/invalid-email': 'Email is invalid.',
  'auth/user-not-found': 'No account with this email address.',
  'auth/email-already-in-use': 'This email is already in use.',
  'auth/wrong-password': 'Password is invalid.',
  'auth/weak-password': 'Password is too weak.',
  'auth/invalid-verification-code': 'Invalid verification code',
  'auth/invalid-credential': 'Invalid credentials.',
  'auth/invalid-phone-number': 'Invalid phone number.',
}

export const getAuthErrorMessage = (code: Code, fallback = 'Oops, something went wrong...') => {
  const message = CustomErrorCodes[code]
  return message || fallback
}

class ClientError extends Error {
  constructor(code: Code) {
    super(CustomErrorCodes[code])
  }
}

export default ClientError
