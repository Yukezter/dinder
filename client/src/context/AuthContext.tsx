import React from 'react'
import { onAuthStateChanged, User, IdTokenResult } from 'firebase/auth'
import {
  DataSnapshot,
  ref,
  onValue,
  onDisconnect,
  serverTimestamp as serverDatabaseTimestamp,
  set,
  off,
  DatabaseReference,
  push,
} from 'firebase/database'
import {
  doc,
  serverTimestamp as serverFirestoreTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, firestore, db } from '../app/firebase'

export type AuthUser = User

export interface IAuthContext {
  user?: AuthUser
  claims?: IdTokenResult['claims'] & {
    accessLevel?: 0 | 1
  }
}

const AuthContext = React.createContext<IAuthContext>({} as IAuthContext)

export const useAuth = () => React.useContext(AuthContext)

export const AuthProvider: React.FC = ({ children }) => {
  const [state, setState] = React.useState<IAuthContext>()

  // Update auth state whenever user signs in / signs out
  // Listen for metadata changes and update token
  React.useEffect(() => {
    let metadataRef: DatabaseReference | null = null
    let callback: ((snapshot: DataSnapshot) => void) | null = null

    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log('onAuthStateChanged', user)

      if (metadataRef && callback) {
        off(metadataRef, 'value', callback)
      }

      if (user) {
        user.getIdTokenResult().then(({ claims }) => {
          setState({ user, claims })

          metadataRef = ref(db, `metadata/${user.uid}/refreshTime`)
          let afterFirstCall = false

          callback = () => {
            if (afterFirstCall) {
              user.getIdTokenResult().then(({ claims }) => {
                setState(prev => ({ ...prev, claims }))
              })
            }
            afterFirstCall = true
          }

          onValue(metadataRef, callback)
        })
      } else {
        setState({})
      }
    })

    return unsubscribe
  }, [])

  // Online presence
  React.useEffect(() => {
    if (!state?.user) {
      return undefined
    }

    const connectedRef = ref(db, '.info/connected')
    const connectionsRef = ref(db, `users/${state.user!.uid}/connections`)
    const lastOnlineRef = ref(db, `users/${state.user!.uid}/lastOnline`)
    const path = `/status/${state.user!.uid}`
    const userStatusFirestoreRef = doc(firestore, path)

    let afterFirstCall = false

    const unsubscribe = onValue(connectedRef, snapshot => {
      if (afterFirstCall) {
        if (snapshot.val() === true) {
          // Store device connection
          const con = push(connectionsRef)

          // Remove device upon disconnection
          onDisconnect(con).remove()

          // Add connection to list
          set(con, true)

          // Update the time this user was last online
          onDisconnect(lastOnlineRef).set(serverDatabaseTimestamp())

          // Update firestore online status
          setDoc(userStatusFirestoreRef, {
            state: 'online',
          })
        }
      }

      afterFirstCall = true
    })

    return unsubscribe
  }, [state])

  // Don't render until Firebase user is determined
  if (state === undefined) {
    return null
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
