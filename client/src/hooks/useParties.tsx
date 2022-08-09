import { useQuery, UseQueryOptions } from 'react-query'

import { PopulatedParty } from '../types'
import { PartiesService, UsersService } from '../services'
import { useUser } from '../context'
import { partyKeys } from '../utils/queryKeys'

// export const useParties = () => {
//   const user = useUser()
//   const queryClient = useQueryClient()
//   const partiesQuery = useQuery<PopulatedParty[]>(
//     partyKeys.all(user.uid),
//     () => new Promise<PopulatedParty[]>(() => {}),
//     {
//       // cacheTime: 10 * 60 * 1000,
//       // staleTime: Infinity,
//       // keepPreviousData: true,
//     }
//   )

//   React.useEffect(() => {
//     let isFirstSnapshot = true

//     const partiesCollection = PartiesService.collection.parties()
//     const q = partiesCollection.where('members', 'array-contains', id).query()
//     const unsubscribe = UsersService.onCollectionSnapshot(q, snapshot => {
//       if (isFirstSnapshot) {
//         isFirstSnapshot = false

//         const newParties = snapshot.docs.map(doc => doc.data()).filter(Boolean)
//         const getPopulatedParties = async () => {
//           const populatedParties = []
//           for (const party of newParties) {
//             const partyKey = partyKeys.party(id, party.id)
//             const members = await UsersService.getUsers(party.members)
//             const newParty = { ...party, members }

//             populatedParties.push(party)

//             queryClient.setQueryData<PopulatedParty>(partyKey, newParty)
//           }

//           queryClient.setQueryData(partyKeys.all(id), populatedParties)
//         }

//         getPopulatedParties().catch(error => {
//           console.log(error)
//         })
//       } else {
//         const currentParties = queryClient.getQueryData<PopulatedParty[]>(partyKeys.all(id))
//         // const hasParty = (id: string) => currentParties?.some(party => party.id === id)
//         const updateParties = async () => {
//           let newParties = currentParties ? [...currentParties] : []

//           for (const change of snapshot.docChanges()) {
//             const party = change.doc.data()
//             const partyKey = partyKeys.party(id, party.id)

//             if (change.type === 'removed') {
//               newParties = newParties.filter(value => value.id !== party.id)
//               queryClient.removeQueries(partyKey)
//             } else {
//               const members = await UsersService.getUsers(party.members)
//               const newParty = { ...party, members }

//               if (change.type === 'added') {
//                 newParties.push(newParty)
//               } else if (change.type === 'modified') {
//                 const index = newParties.findIndex(value => value.id === party.id)
//                 if (index > -1) {
//                   newParties[index] = newParty
//                 }
//               }

//               queryClient.setQueryData<PopulatedParty>(partyKey, newParty)
//             }
//           }

//           queryClient.setQueryData(partyKeys.all(id), newParties)
//         }

//         updateParties().catch(error => {
//           console.log(error)
//         })
//       }
//     })

//     return () => {
//       unsubscribe()
//     }
//   }, [id, queryClient])

//   return partiesQuery
// }

export const useGetParties = <T extends unknown = PopulatedParty[]>(
  options?: UseQueryOptions<PopulatedParty[], unknown, T>
) => {
  const user = useUser()
  return useQuery<PopulatedParty[], unknown, T>(
    partyKeys.details(),
    async () => {
      const data = await PartiesService.getParties()
      const populatedParties = []
      for (const party of data) {
        const members = await UsersService.getUsers(party.members)
        populatedParties.push({
          ...party,
          members,
        })
      }

      return populatedParties
    },
    {
      cacheTime: 10 * 60 * 1000,
      ...options,
    }
  )
}
