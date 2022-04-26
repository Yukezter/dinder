// import React from 'react'
// import { onAuthStateChanged } from 'firebase/auth'
// import { Unsubscribe, Timestamp, FirestoreError } from 'firebase/firestore'
// import {
//   useMutation,
//   useQueryClient,
//   UseMutateFunction,
//   UseMutationResult,
//   MutationKey,
//   Mutation,
// } from 'react-query'
// import debounce from 'lodash.debounce'
// import Dialog from '@mui/material/Dialog'
// import Box from '@mui/material/Box'
// import Paper from '@mui/material/Paper'
// import Stack from '@mui/material/Stack'
// import Avatar from '@mui/material/Avatar'
// import Typography from '@mui/material/Typography'
// import IconButton from '@mui/material/IconButton'
// import AddIcon from '@mui/icons-material/AddCircleOutline'
// import RemoveIcon from '@mui/icons-material/RemoveCircleOutline'
// import BlockIcon from '@mui/icons-material/DoDisturb'

// import { usersService } from '../services'
// import { IAuthContext } from '../context/AuthContext'
// import { useOnCollectionSnapshot, useOnDocumentSnapshot } from '../hooks'
// import { UseOnDocumentSnapshotResult } from '../hooks/useOnDocumentSnapshot'
// import { UseOnCollectionSnapshotResult } from '../hooks/useOnCollectionSnapshot'
// import { FirebaseError } from 'firebase/app'

// const sleepThenThrow = (ms: number = 3000) =>
//   new Promise((resolve, reject) => {
//     setTimeout(() => reject(new FirebaseError('', '')), ms)
//   })

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

// export interface Business {
//   id: number
//   image: string
//   name: string
//   rating: number
//   reviews: number
//   location: string
//   url: string
//   type: 'saved' | 'blocked'
//   createdAt: Timestamp
// }

// export type Businesses = {
//   [yelpId: string]: Business
// }

// export interface Party {
//   id: string
//   name: string
//   admin: string
//   members: string[]
//   active: boolean
//   lastActive: Timestamp
//   created: Timestamp
//   settings?: {
//     latitude: number
//     longitude: number
//     radius: number
//     price: number
//     categories: string
//   }
// }

// export interface Likes {
//   [yelpId: string]: { [userId: string]: true }
// }

// export interface PopulatedParty extends Omit<Party, 'members'> {
//   members: User[]
// }

// export type Contacts = { [userId: string]: boolean }

// type ContactsMutationResult = UseMutationResult<string, FirestoreError, User>
// type PartyMutationResult = UseMutationResult<void, FirestoreError, Party>
// type PopulatedPartyMutationResult = UseMutationResult<
//   void,
//   FirestoreError,
//   PopulatedParty
// >

// export interface IFirestoreContext {
//   user: UseOnDocumentSnapshotResult<User, undefined>
//   contacts: UseOnDocumentSnapshotResult<Contacts, User[]>
//   addContact: ContactsMutationResult
//   deleteContact: ContactsMutationResult
//   blockContact: ContactsMutationResult
//   viewUserProfile: (userProfile: User) => void
//   parties: UseOnDocumentSnapshotResult<Party, PopulatedParty[]>
//   updateParty: PartyMutationResult
//   deleteParty: PopulatedPartyMutationResult
//   hasPendingUpdate: (mutationKey: MutationKey) => boolean
// }

// const FirestoreContext = React.createContext<IFirestoreContext>(
//   {} as IFirestoreContext
// )

// export const useFirestore = () => React.useContext(FirestoreContext)

// type FirestoreProviderProps = {
//   auth: Required<IAuthContext>
// }

// let renders = 0
// export const FirestoreProvider: React.FC<FirestoreProviderProps> = props => {
//   console.log('renders:', ++renders)

//   const { auth, children } = props
//   const user = useOnDocumentSnapshot({
//     ref: usersService.docs.user(auth.user.uid).ref,
//     error: error => {
//       console.log(error)
//     },
//   })

//   const contacts = useOnDocumentSnapshot<Contacts, User[]>({
//     ref: usersService.docs.contacts(auth.user.uid).ref,
//     async transform(snapshot) {
//       const data = snapshot.data()
//       if (!data) {
//         return []
//       }

//       const contactIds = Object.keys(data).filter(id => data[id])
//       const contactsSnapshot = await usersService.getUsers(contactIds)
//       return contactsSnapshot.docs.map(doc => doc.data())
//     },
//     error(error) {
//       console.log(error)
//     },
//   })

//   const parties = useOnCollectionSnapshot<Party, PopulatedParty[]>({
//     ref: usersService.collections.parties.where(
//       'members',
//       'array-contains',
//       auth.user.uid
//     ),
//     async transform(snapshot) {
//       const partiesWithMembers = []
//       for (const party of snapshot.docs) {
//         const members = await usersService.getUsers(party.data().members)
//         partiesWithMembers.push({
//           ...party.data(),
//           members: members.docs.map(member => member.data()),
//         })
//       }
//       return partiesWithMembers
//     },
//     error(error) {
//       console.log(error)
//     },
//   })

//   const queryClient = useQueryClient()
//   const pendingUpdates = React.useMemo(() => new Set<string>(), [])
//   const hasPendingUpdate = React.useCallback((mutationKey: MutationKey) => {
//     const a = queryClient.getMutationCache().getAll()
//     console.log(a)
//     return pendingUpdates.has(JSON.stringify(mutationKey))
//   }, [])

//   const addContact = useMutation<string, FirestoreError, User>(
//     async data => {
//       return usersService.addContact(data.uid)
//     },
//     {
//       mutationKey: 'contacts',
//       async onMutate(data) {
//         pendingUpdates.add(JSON.stringify(['contacts', data.uid]))
//         contacts.setData(prevData => [...prevData!, data])
//       },
//       onError(error, variables, context) {
//         contacts.setData(prevData =>
//           prevData!.filter(({ uid }) => uid !== variables.uid)
//         )
//       },
//       onSettled(data, error, variables) {
//         pendingUpdates.delete(JSON.stringify(['contacts', variables.uid]))
//       },
//     }
//   )

//   const deleteContact = useMutation<string, FirestoreError, User>(
//     async data => {
//       return usersService.deleteContact(data.uid)
//     },
//     {
//       mutationKey: 'contacts',
//       async onMutate(data) {
//         pendingUpdates.add(JSON.stringify(['contacts', data.uid]))
//         contacts.setData(prevData =>
//           prevData!.filter(({ uid }) => uid !== data.uid)
//         )
//       },
//       onError(error, variables, context) {
//         contacts.setData(prevData => [...prevData!, variables])
//       },
//       onSettled(data, error, variables) {
//         pendingUpdates.delete(JSON.stringify(['contacts', variables.uid]))
//       },
//     }
//   )

//   const blockContact = useMutation<string, FirestoreError, User>(
//     async data => {
//       await sleepThenThrow()
//       return usersService.blockContact(data.uid)
//     },
//     {
//       async onMutate(data) {
//         pendingUpdates.add(JSON.stringify(['contacts', data.uid]))
//         contacts.setData(prevData =>
//           prevData!.filter(({ uid }) => uid !== data.uid)
//         )
//       },
//       onError(error, variables, context) {
//         contacts.setData(prevData => [...prevData!, variables])
//       },
//       onSettled(data, error, variables) {
//         pendingUpdates.delete(JSON.stringify(['contacts', variables.uid]))
//       },
//     }
//   )

//   const updateParty = useMutation<void, FirestoreError, Party>(
//     async party => usersService.updateParty(party),
//     {
//       async onSuccess(data, party) {
//         const members = await usersService.getUsers(party.members)
//         parties.setData(prevData => {
//           const newParties = prevData!.filter(({ id }) => id !== party.id)
//           return [
//             ...newParties,
//             {
//               ...party,
//               members: members.docs.map(doc => doc.data()),
//             },
//           ]
//         })
//       },
//     }
//   )

//   const deleteParty = useMutation<void, FirestoreError, PopulatedParty>(
//     async party => usersService.deleteParty(party.id),
//     {
//       onMutate(party) {
//         parties.setData(prevData =>
//           prevData!.filter(({ id }) => id !== party.id)
//         )
//       },
//       onError(data, party) {
//         parties.setData(prevData => [...prevData!, party])
//       },
//     }
//   )

//   console.log('parties', parties.state.data)

//   const [currentUserProfile, setCurrentUserProfile] = React.useState<User>()
//   const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false)

//   const isUserProfileUpdating = hasPendingUpdate([
//     'contacts',
//     currentUserProfile?.uid,
//   ])

//   if (!user.state.data || !contacts.state.data) {
//     return <div>Loading...</div>
//   }

//   const isUserProfileAContact = contacts.state.data.some(
//     ({ uid }) => uid === currentUserProfile?.uid
//   )

//   const viewUserProfile = (userProfile: User) => {
//     setCurrentUserProfile(userProfile)
//     setIsProfileDialogOpen(true)
//   }

//   return (
//     <>
//       <FirestoreContext.Provider
//         value={{
//           user,
//           viewUserProfile,
//           contacts,
//           addContact,
//           deleteContact,
//           blockContact,
//           parties,
//           updateParty,
//           deleteParty,
//           hasPendingUpdate,
//         }}
//       >
//         {children}
//       </FirestoreContext.Provider>
//       <Dialog
//         open={isProfileDialogOpen && !!currentUserProfile}
//         onClose={() => setIsProfileDialogOpen(false)}
//         PaperProps={{
//           sx: {
//             backgroundColor: 'transparent',
//             boxShadow: 'none',
//             overflowY: 'initial',
//           },
//         }}
//       >
//         <Box
//           component={Paper}
//           display='flex'
//           flexDirection='column'
//           alignItems='center'
//           maxWidth={400}
//           p={5}
//         >
//           <Stack alignItems='center'>
//             <div>
//               <Typography variant='h5' align='center'>
//                 {currentUserProfile?.name}
//               </Typography>
//               <Typography variant='h6' align='center'>
//                 {currentUserProfile?.username}
//               </Typography>
//             </div>
//             <Avatar
//               src={currentUserProfile?.photoURL}
//               sx={{ m: 2, width: 120, height: 120 }}
//             />
//           </Stack>
//           <Typography variant='body1' fontWeight={600} paragraph>
//             About me
//           </Typography>
//           <Typography variant='body2' align='center' paragraph>
//             {currentUserProfile?.about}
//           </Typography>
//           <Box display='flex'>
//             {isUserProfileAContact ? (
//               <IconButton
//                 aria-label='delete-contact'
//                 onClick={() => deleteContact.mutate(currentUserProfile!)}
//                 disabled={isUserProfileUpdating}
//               >
//                 <RemoveIcon />
//               </IconButton>
//             ) : (
//               <IconButton
//                 aria-label='add-contact'
//                 onClick={() => addContact.mutate(currentUserProfile!)}
//                 disabled={isUserProfileUpdating}
//               >
//                 <AddIcon />
//               </IconButton>
//             )}
//             <IconButton aria-label='delete' disabled={isUserProfileUpdating}>
//               <BlockIcon />
//             </IconButton>
//           </Box>
//         </Box>
//       </Dialog>
//     </>
//   )
// }

export {}
