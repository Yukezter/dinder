import React from 'react'
import { FirebaseError } from 'firebase/app'
import { useParams, Navigate, Outlet } from 'react-router-dom'
import { useQuery, useIsFetching } from 'react-query'
import CircularProgress from '@mui/material/CircularProgress'

import { PopulatedParty } from '../types'
import { partyKeys } from '../utils/queryKeys'
import { PartiesService } from '../services'

const ProtectedPartyRoute = () => {
  const { partyId } = useParams()

  // Inside PartiesContext, we manually set the query data for each individual party.
  // So, if we wait until all parties are done loading before enabling this query,
  // we can simply use the cached query data associated with this party's query key.
  // This query function will only run if the party doesn't exist, or the current user
  // isn't a member of this party.
  const isFetchingParties = useIsFetching(partyKeys.details(), { exact: true })
  const partyQuery = useQuery<PopulatedParty | undefined, FirebaseError>(
    partyKeys.detail(partyId),
    () => {
      return PartiesService.getParty(partyId)
    },
    {
      refetchOnMount: true,
      enabled: isFetchingParties === 0,
      retry: (failureCount, error) => {
        // Don't retry failed query if this user isn't a member
        if (error.code === 'permission-denied') {
          return false
        }

        return failureCount <= 3
      },
    }
  )

  if (!partyId) {
    return <Navigate to='/404' replace />
  }

  if (isFetchingParties > 0 || partyQuery.isLoading) {
    return <CircularProgress sx={{ m: 'auto' }} />
  }

  if (partyQuery.error?.code === 'permission-denied') {
    return <Navigate to='/403' replace />
  }

  if (!partyQuery.data) {
    return <Navigate to='/404' replace />
  }

  return <Outlet context={{ party: partyQuery.data }} />
}

export default ProtectedPartyRoute

// type Members = { [userId: string]: true } | undefined

// const ProtectedPartyRoute = () => {
//   const { partyId } = useParams()
//   const queryClient = useQueryClient()
//   const user = useUser()
//   const membersKey = partyKeys.members(user.uid, partyId)
//   const membersQuery = useQuery<Members>(
//     membersKey,
//     () => new Promise<Members>(() => {}),
//     {
//       cacheTime: 0,
//       staleTime: Infinity,
//     }
//   )

//   React.useEffect(() => {
//     if (!partyId) {
//       return
//     }

//     const unsubscribe = PartiesService.onDocumentSnapshot(
//       PartiesService.doc.members(partyId),
//       snapshot => {
//         const data = snapshot.data()
//         queryClient.setQueryData<Members>(membersKey, data)
//       },
//       error => {
//         console.log(error)
//       }
//     )

//     return () => {
//       unsubscribe()
//     }
//   }, [])

//   if (membersQuery.isLoading) {
//     return <CircularProgress />
//   }

//   if (!partyId || !membersQuery.data) {
//     return <Navigate to='/404' replace />
//   }

//   if (!Boolean(membersQuery.data[user.uid])) {
//     return <Navigate to='/403' replace />
//   }

//   return (
//     <Outlet />
//   )
// }

// const ProtectedPartyRoute = () => {
//   const { partyId } = useParams()
//   const queryClient = useQueryClient()
//   const user = useUser()
//   const partyKey = partyKeys.party(user.uid, partyId)
//   const partyQuery = useQuery<PopulatedParty | undefined>(
//     partyKey,
//     () => new Promise<PopulatedParty | undefined>(() => {}),
//     {
//       cacheTime: 0,
//       staleTime: Infinity,
//     }
//   )

//   // const locationState = (location.state as { party?: PopulatedParty }) || {}

//   const isAMember = React.useCallback((data: PopulatedParty) => {
//     return data.members.some(member => {
//       return member.uid === user.uid
//     })
//   }, [])

//   React.useEffect(() => {
//     if (!partyId) {
//       return
//     }

//     // let isFirstCall = true

//     const unsubscribe = PartiesService.onDocumentSnapshot(
//       PartiesService.doc.party(partyId),
//       snapshot => {
//         const data = snapshot.data()

//         if (data) {
//             UsersService.getUsers(data.members)
//               .then(members => {
//                 queryClient.setQueryData<PopulatedParty | undefined>(
//                   partyKey,
//                   { ...data, members }
//                 )
//               })
//               .catch(error => {
//                 console.log(error)
//               })
//         } else {
//           queryClient.setQueryData<PopulatedParty | undefined>(
//             partyKey,
//             data
//           )
//         }
//       },
//       error => {
//         console.log(error)
//       }
//     )

//     return () => {
//       unsubscribe()
//     }
//   }, [partyId])

//   if (partyQuery.isLoading) {
//     return <CircularProgress />
//   }

//   if (!partyId || !partyQuery.data) {
//     return <Navigate to='/404' replace />
//   }

//   if (!isAMember(partyQuery.data)) {
//     return <Navigate to='/403' replace />
//   }

//   return (
//     <Outlet context={{ party: partyQuery.data }} />
//   )
// }

//   const unsubscribe = PartiesService.onDocumentSnapshot(
//     PartiesService.doc.party(partyId),
//     snapshot => {
//       const data = snapshot.data()

//       if (data) {
//           UsersService.getUsers(data.members)
//             .then(members => {
//               queryClient.setQueryData<PopulatedParty | undefined>(
//                 partyKey,
//                 { ...data, members }
//               )
//             })
//             .catch(error => {
//               console.log(error)
//             })
//       } else {
//         queryClient.setQueryData<PopulatedParty | undefined>(
//           partyKey,
//           data
//         )
//       }
//     },
//     error => {
//       console.log(error)
//     }
//   )

//   return () => {
//     unsubscribe()
//   }
// }, [partyId])
