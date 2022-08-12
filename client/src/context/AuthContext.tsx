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
import { doc, setDoc } from 'firebase/firestore'
import { useQueryClient } from 'react-query'
import { auth, firestore, db } from '../firebase'

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
  const queryClient = useQueryClient()
  const [state, setState] = React.useState<IAuthContext>()

  const hasCustomClaims = React.useRef<boolean>(false)
  React.useEffect(() => {
    hasCustomClaims.current = state?.claims?.accessLevel !== undefined
  }, [state?.claims?.accessLevel])

  // Track the auth state and listen for metadata changes
  // so that we can update the user's custom claims
  React.useEffect(() => {
    let metadataRef: DatabaseReference | null = null
    let callback: ((snapshot: DataSnapshot) => void) | null = null

    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log('onAuthStateChanged:', user)

      if (metadataRef && callback) {
        off(metadataRef, 'value', callback)
      }

      if (user) {
        user.getIdTokenResult().then(({ claims }) => {
          setState({ user, claims })
          console.log('claims:', claims)

          metadataRef = ref(db, `metadata/${user.uid}/refreshTime`)
          // let isFirstCall = true

          callback = () => {
            // if (!isFirstCall) {
            if ((claims?.accessLevel as number | undefined) !== 1) {
              user.getIdTokenResult(true).then(({ claims }) => {
                console.log('claims refresh:', claims)
                setState(prev => ({ ...prev, claims }))
              })
            }

            // isFirstCall = false
            // }
          }

          onValue(metadataRef, callback)
        })
      } else {
        queryClient.removeQueries()
        setState({})
      }
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient])

  // Manage the authenticated user's online presence
  React.useEffect(() => {
    if (!state?.user) {
      return
    }

    const connectedRef = ref(db, '.info/connected')
    const connectionsRef = ref(db, `users/${state.user!.uid}/connections`)
    const lastOnlineRef = ref(db, `users/${state.user!.uid}/lastOnline`)
    const userStatusFirestoreRef = doc(firestore, `/status/${state.user!.uid}`)

    let afterFirstCall = false

    const unsubscribe = onValue(connectedRef, snapshot => {
      if (afterFirstCall) {
        if (snapshot.val() === false) {
          return
        }

        // Store device connection
        const con = push(connectionsRef)

        // Remove device upon disconnection
        onDisconnect(con).remove()

        // Add connection to list
        set(con, true)

        // Update the time this user was last online
        onDisconnect(lastOnlineRef).set(serverDatabaseTimestamp())

        // Update firestore online status
        setDoc(userStatusFirestoreRef, { state: 'online' })
      }

      afterFirstCall = true
    })

    return () => {
      unsubscribe()
    }
  }, [state?.user])

  // Don't render until Firebase user is determined
  if (state === undefined) {
    return null
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
