import React from 'react'
import { Unsubscribe, Timestamp, FirestoreError } from 'firebase/firestore'
import { useQuery, useMutation, useQueryClient, MutationKey } from 'react-query'

import { usersService } from '../services'
import { IAuthContext } from '../context/AuthContext'
import { useOnCollectionSnapshot, useOnDocumentSnapshot } from '../hooks'
import { UseOnDocumentSnapshotResult } from '../hooks/useOnDocumentSnapshot'

const sleepThenThrow = (ms: number = 3000) =>
  new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error()), ms)
  })

export type OnlineStatus = {
  [userId: string]: {
    state: 'online' | 'offline'
    lastOnline?: string
  }
}

export type Username = { userId: string }

export type User = {
  uid: string
  photoURL: string
  name: string
  username: string
  about: string
}

export type Contacts = { [userId: string]: boolean }

export type UserParties = { [partyId: string]: boolean }

export interface Business {
  id: number
  image: string
  name: string
  rating: number
  reviews: number
  location: string
  url: string
  type: 'saved' | 'blocked'
  createdAt: Timestamp
}

export type Businesses = {
  [yelpId: string]: Business
}

export interface Party {
  id: string
  name: string
  admin: string
  members: string[]
  active: boolean
  lastActive: Timestamp
  created: Timestamp
  settings?: {
    latitude: number
    longitude: number
    radius: number
    price: number
    categories: string[]
    openNow?: boolean
    offset?: number
  }
}

export type YelpBusiness = {
  rating: number
  price: string
  phone: string
  id: string
  alias: string
  is_closed: boolean
  categories: {
    alias: string
    title: string
  }[]
  review_count: number
  name: string
  url: string
  coordinates: {
    latitude: number
    longitude: number
  }
  image_url: string
  location: {
    city: string
    country: string
    address1: string
    address2?: string
    address3?: string
    state: string
    zip_code: number
  }
  distance: number
  transactions: string[]
}

export type YelpResponse = {
  total: number
  businesses: YelpBusiness[]
  region: {
    center: {
      latitude: number
      longitude: number
    }
  }
}

export interface Likes {
  [yelpId: string]: { [userId: string]: true }
}

export interface PopulatedParty extends Omit<Party, 'members'> {
  members: User[]
}

const UserContext = React.createContext<User>({} as User)
export const useUser = () => React.useContext(UserContext)

export const UserProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props
  const [user, setUser] = React.useState<User>()

  React.useEffect(() => {
    if (!id) {
      return
    }

    const userRef = usersService.docs.user(id).ref
    const unsubscribe = usersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data()
      setUser(data)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return <UserContext.Provider value={user!}>{children}</UserContext.Provider>
}

const ContactsContext = React.createContext<Contacts | undefined>(undefined)
export const useContacts = () => React.useContext(ContactsContext)

export const ContactsProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props
  const [contacts, setContacts] = React.useState<Contacts>()

  React.useEffect(() => {
    if (!id) {
      return
    }

    const userRef = usersService.docs.contacts(id).ref
    const unsubscribe = usersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data() || {}
      setContacts(data)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <ContactsContext.Provider value={contacts}>
      {children}
    </ContactsContext.Provider>
  )
}

const PartiesContext = React.createContext<UserParties>({} as UserParties)
export const useParties = () => React.useContext(PartiesContext)

export const PartiesProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props
  const [parties, setParties] = React.useState<UserParties>({})

  React.useEffect(() => {
    if (!id) {
      return
    }

    const userRef = usersService.docs.userParties(id).ref
    const unsubscribe = usersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data() || {}
      setParties(data)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <PartiesContext.Provider value={parties}>
      {children}
    </PartiesContext.Provider>
  )
}

type PresenceContextProps = {
  usersOnline: OnlineStatus
  isOnline: (id?: string) => boolean
}

const PresenceContext = React.createContext<PresenceContextProps>(
  {} as PresenceContextProps
)
export const usePresence = () => React.useContext(PresenceContext)

export const PresenceProvider: React.FC = props => {
  const { children } = props
  const [usersOnline, setUsersOnline] = React.useState<OnlineStatus>({})

  const isOnline = React.useCallback(
    (id?: string) => {
      return !!id && usersOnline[id] && usersOnline[id].state === 'online'
    },
    [usersOnline]
  )

  React.useEffect(() => {
    const statusRef = usersService.collections.status.ref
    const unsubscribe = usersService.onCollectionSnapshot(
      statusRef,
      snapshot => {
        const data = snapshot.docs.reduce<OnlineStatus>((all, doc) => {
          if (doc.exists()) {
            const status = doc.data()
            all[doc.id] = {
              state: 'offline',
              ...status,
            }
          }
          return all
        }, {})

        setUsersOnline(data)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <PresenceContext.Provider value={{ usersOnline, isOnline }}>
      {children}
    </PresenceContext.Provider>
  )
}

const Loading: React.FC = ({ children }) => {
  const user = useUser()
  const contacts = useContacts()
  const parties = useParties()

  if (!user || !contacts || !parties) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}

type FirestoreProvidersProps = {
  auth: Required<IAuthContext>
}

export const FirestoreProviders: React.FC<FirestoreProvidersProps> = props => {
  const { auth, children } = props

  return (
    <UserProvider id={auth.user.uid}>
      <ContactsProvider id={auth.user.uid}>
        <PartiesProvider id={auth.user.uid}>
          <PresenceProvider>
            <Loading>{children}</Loading>
          </PresenceProvider>
        </PartiesProvider>
      </ContactsProvider>
    </UserProvider>
  )
}

// const [user] = useOnDocumentSnapshot<User>({
//   ref: usersService.docs.user(auth.user.uid).ref,
//   error: error => {
//     console.log(error)
//   },
// })

// const [contactIds, setContactIds] = useOnDocumentSnapshot({
//   ref: usersService.docs.contacts(auth.user.uid).ref,
//   error(error) {
//     console.log(error)
//   },
// })

// const [partyIds, setPartyIds] = useOnDocumentSnapshot({
//   ref: usersService.docs.userParties(auth.user.uid).ref,
//   error(error) {
//     console.log(error)
//   },
// })

// ---------------------------------------------------------------------------------

// const [user, setUser] = React.useState<User>()
// const [contacts, setContacts] = React.useState<User[]>()
// const [parties, setParties] = React.useState<Party[]>()

// React.useEffect(() => {
//   let unsubscribeOnUserSnapshot: Unsubscribe | null = null
//   let unsubscribeOnContactsSnapshot: Unsubscribe | null = null
//   let unsubscribeOnPartiesSnapshot: Unsubscribe | null = null

//   const unsubscribeOnAuthStateChanged = onAuthStateChanged(
//     auth,
//     user => {
//       if (unsubscribeOnUserSnapshot) {
//         unsubscribeOnUserSnapshot()
//       }

//       if (unsubscribeOnContactsSnapshot) {
//         unsubscribeOnContactsSnapshot()
//       }

//       if (user) {
//         const { uid } = user

//         unsubscribeOnUserSnapshot = usersService.onDocumentSnapshot(
//           usersService.docs.user(uid).ref,
//           snapshot => {
//             const data = snapshot.data()
//             console.log(data)
//             if (data) setUser(data)
//           },
//           err => console.log(err)
//         )

//         unsubscribeOnContactsSnapshot = usersService.onDocumentSnapshot(
//           usersService.docs.contacts(uid).ref,
//           snapshot => {
//             const data = snapshot.data()
//             if (data) {
//               const contactIds = Object.keys(data).filter(id => data[id])
//               usersService
//                 .getUsers(contactIds)
//                 .then(contactsSnapshot => {
//                   const newContacts = contactsSnapshot.docs.map(doc =>
//                     doc.data()
//                   )
//                   console.log('unsubscribeOnContactsSnapshot', newContacts)
//                   setContacts(newContacts)
//                 })
//                 .catch(err => {
//                   console.log(err)
//                 })
//             } else {
//               setContacts([])
//             }
//           },
//           err => console.log(err)
//         )

//         unsubscribeOnPartiesSnapshot = usersService.onPartiesSnapshot(
//           uid,
//           snapshot => {
//             setParties(snapshot.docs.map(doc => doc.data()))
//           },
//           err => console.log(err)
//         )
//       }
//     },
//     err => {
//       console.log(err)
//     }
//   )

//   return unsubscribeOnAuthStateChanged
// }, [])

// type ContactsMutationResult = UseMutationResult<string, FirestoreError, { user: User }>
// type PartyMutationResult = UseMutationResult<void, FirestoreError, Party>

// const queryClient = useQueryClient()

// const addContact = React.useCallback(async (contact: User) => {
//   await queryClient.executeMutation<string, FirestoreError, User>({
//     mutationKey: ['contacts', contact.uid],
//     variables: contact,
//     retry: 3,
//     mutationFn: async data => {
//       await sleepThenThrow()
//       return usersService.addContact(data.uid)
//     },
//     async onMutate(data) {
//       contacts.setData(prevData => [...prevData!, data])
//     },
//     onError(error, variables) {
//       contacts.setData(prevData =>
//         prevData!.filter(({ uid }) => uid !== variables.uid)
//       )
//     },
//   })
// }, [])

// const deleteContact = React.useCallback(async (contact: User) => {
//   const mutation = queryClient.getMutationCache().find({
//     mutationKey: ['contacts', contact.uid],
//     exact: true,
//   })

//   if (mutation) {
//     await mutation.execute()
//   } else {
//     await queryClient.executeMutation<string, FirestoreError, User>({
//       mutationKey: ['contacts', contact.uid],
//       variables: contact,
//       // retry: 3,
//       mutationFn: async data => {
//         await sleepThenThrow()
//         return usersService.deleteContact(data.uid)
//       },
//       async onMutate(data) {
//         contacts.setData(prevData =>
//           prevData!.filter(({ uid }) => uid !== data.uid)
//         )
//       },
//       onError(error, variables) {
//         contacts.setData(prevData => [...prevData!, variables])
//       }
//     })
//   }
// }, [])

// const blockContact = React.useCallback(async (contact: User) => {
//   await queryClient.executeMutation<string, FirestoreError, User>({
//     mutationKey: ['contacts', contact.uid],
//     variables: contact,
//     retry: 3,
//     mutationFn: async data => {
//       return usersService.blockContact(data.uid)
//     },
//     async onMutate(data) {
//       contacts.setData(prevData =>
//         prevData!.filter(({ uid }) => uid !== data.uid)
//       )
//     },
//     onError(error, variables) {
//       contacts.setData(prevData => [...prevData!, variables])
//     }
//   })
// }, [])

// const updateParty = React.useCallback(async (party: Party) => {
//   await queryClient.executeMutation<void, FirestoreError, Party>({
//     mutationKey: ['contacts', party.id],
//     variables: party,
//     retry: 3,
//     mutationFn: async party => usersService.updateParty(party),
//     async onSuccess(data, party) {
//       const members = await usersService.getUsers(party.members)
//       parties.setData(prevData => {
//         const newParties = prevData!.filter(({ id }) => id !== party.id)
//         return [
//           ...newParties,
//           {
//             ...party,
//             members: members.docs.map(doc => doc.data()),
//           },
//         ]
//       })
//     },
//   })
// }, [])

// const deleteParty = React.useCallback(async (party: PopulatedParty) => {
//   await queryClient.executeMutation<void, FirestoreError, PopulatedParty>({
//     mutationKey: ['contacts', party.id],
//     variables: party,
//     retry: 3,
//     mutationFn: async party => usersService.deleteParty(party.id),
//     onMutate(party) {
//       parties.setData(prevData =>
//         prevData!.filter(({ id }) => id !== party.id)
//       )
//     },
//     onError(data, party) {
//       parties.setData(prevData => [...prevData!, party])
//     },
//   })
// }, [])

// const hasPendingUpdate = React.useCallback((mutationKey: MutationKey) => {
//   const mutation = queryClient.getMutationCache().find({
//     mutationKey,
//     exact: true,
//     predicate: mutation => mutation.state.status === 'loading',
//   })

//   const all = queryClient.getMutationCache().getAll()
//   console.log(all.map(a => a.state))
//   if (!mutation) {
//     return false
//   }

//   console.log('hasPendingUpdate', mutation)
//   console.log('hasPendingUpdate', mutation.state)
//   return true
// }, [])

// const requestsQueue = React.useMemo<(() => Promise<void>)[]>(() => [], [])

//   const debouncedUpdate = React.useCallback(
//     debounce(() => {
//       if (requestsQueue.length === 0) {
//         return
//       }

//     }, 5000),
//     []
//   )

//   const addUpdateToRequestQueue = React.useCallback((id: string, request: () => Promise<string>): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       requestsQueue.push(async () => {
//         try {
//           const value = await request()
//           resolve(value)
//         } catch (error) {
//           reject(error)
//         }
//       })
//     })
//   }, [])

// import React from 'react'
// import { onAuthStateChanged } from 'firebase/auth'
// import { Unsubscribe } from 'firebase/firestore'

// import { auth } from '../app/firebase'
// import { usersService } from '../services'

// export type OnlineStatus = {
//   state: 'online' | 'offline'
//   lastOnline?: string
// }

// export type Username = { userId: string }

// export type User = {
//   uid: string
//   photoURL: string
//   name: string
//   username: string
//   about: string
// }

// export type Contacts = { [userId: string]: boolean }

// export interface IFirestoreContext {
//   user: User | undefined
//   setUser: React.Dispatch<React.SetStateAction<User | undefined>>
//   contacts: User[]
// }

// const FirestoreContext = React.createContext<IFirestoreContext>(
//   {} as IFirestoreContext
// )

// export const useFirestore = () => React.useContext(FirestoreContext)

// export const FirestoreProvider: React.FC = ({ children }) => {
//   const [user, setUser] = React.useState<User>()
//   const [contacts, setContacts] = React.useState<User[]>()

//   React.useEffect(() => {
//     let unsubscribeOnUserSnapshot: Unsubscribe | null = null
//     let unsubscribeOnContactsSnapshot: Unsubscribe | null = null

//     const unsubscribeOnAuthStateChanged = onAuthStateChanged(
//       auth,
//       user => {
//         if (unsubscribeOnUserSnapshot) {
//           unsubscribeOnUserSnapshot()
//         }

//         if (unsubscribeOnContactsSnapshot) {
//           unsubscribeOnContactsSnapshot()
//         }

//         if (user) {
//           const { uid } = user

//           unsubscribeOnUserSnapshot = usersService.onUserSnapshot(
//             uid,
//             snapshot => {
//               const data = snapshot.data()
//               console.log(data)
//               if (data) setUser(data)
//             },
//             err => console.log(err)
//           )

//           unsubscribeOnContactsSnapshot = usersService.onContactsSnapshot(
//             uid,
//             snapshot => {
//               const data = snapshot.data()
//               if (data) {
//                 const contactIds = Object.keys(data).filter(contactId => {
//                   return data[contactId]
//                 })

//                 console.log('onContactsSnapshot', data)

//                 usersService
//                   .getUsers(contactIds)
//                   .then(contactsSnapshot => {
//                     setContacts(contactsSnapshot.docs.map(doc => doc.data()))
//                   })
//                   .catch(err => {
//                     console.log(err)
//                   })
//               } else {
//                 setContacts([])
//               }
//             },
//             err => console.log(err)
//           )
//         }
//       },
//       err => {
//         console.log(err)
//       }
//     )

//     return unsubscribeOnAuthStateChanged
//   }, [])

//   if (!user || !contacts) {
//     return <div>Loading...</div>
//   }

//   const value = { user, setUser, contacts }

//   return (
//     <FirestoreContext.Provider value={value}>
//       {children}
//     </FirestoreContext.Provider>
//   )
// }
