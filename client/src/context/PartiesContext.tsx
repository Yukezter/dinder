import React from 'react'
import { useQuery, useQueryClient, UseQueryResult } from 'react-query'

import { Party, PopulatedParty } from '../types'
import { UsersService } from '../services/users'
import { PartiesService } from '../services/parties'
import { partyKeys } from '../utils/queryKeys'

const PartiesContext = React.createContext<UseQueryResult<PopulatedParty[], unknown>>(
  {} as UseQueryResult<PopulatedParty[], unknown>
)
export const useParties = () => React.useContext(PartiesContext)

export const PartiesProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props

  if (!id) {
    throw new Error('No user id provided!')
  }

  const queryClient = useQueryClient()
  const partiesQuery = useQuery<PopulatedParty[]>(
    partyKeys.details(),
    () => new Promise<PopulatedParty[]>(() => {})
  )

  React.useEffect(() => {
    queryClient.setQueryDefaults(partyKeys.details(), {
      cacheTime: Infinity,
      staleTime: Infinity,
    })
  }, [])

  React.useEffect(() => {
    let isFirstSnapshot = true

    const partiesCollection = PartiesService.collection.parties()
    const q = partiesCollection.where('members', 'array-contains', id).query()
    const unsubscribe = UsersService.onCollectionSnapshot(q, snapshot => {
      if (isFirstSnapshot) {
        isFirstSnapshot = false

        const newParties = snapshot.docs.map(doc => doc.data()).filter(Boolean)
        const getPopulatedParties = async () => {
          const populatedParties = []
          for (const party of newParties) {
            const partyKey = partyKeys.detail(party.id)
            const members = await UsersService.getUsers(party.members)
            const newParty = { ...party, members }

            populatedParties.push(newParty)

            queryClient.setQueryData<PopulatedParty>(partyKey, newParty)
          }

          queryClient.setQueryData<PopulatedParty[]>(partyKeys.details(), populatedParties)
        }

        getPopulatedParties().catch(error => {
          console.log(error)
        })
      } else {
        const currentParties = queryClient.getQueryData<PopulatedParty[]>(partyKeys.details())

        const updateParties = async () => {
          let newParties = currentParties ? [...currentParties] : []

          for (const change of snapshot.docChanges()) {
            const party = change.doc.data()
            const partyKey = partyKeys.detail(party.id)

            if (change.type === 'removed') {
              newParties = newParties.filter(value => value.id !== party.id)

              queryClient.removeQueries(partyKey)
            } else {
              const members = await UsersService.getUsers(party.members)
              const newParty = { ...party, members }

              const index = newParties.findIndex(value => value.id === party.id)
              if (index > -1) {
                newParties[index] = newParty
              } else if (change.type === 'added') {
                newParties.push(newParty)
              }

              queryClient.setQueryData<PopulatedParty>(partyKey, newParty)
            }
          }

          queryClient.setQueryData<PopulatedParty[]>(partyKeys.details(), newParties)
        }

        updateParties().catch(error => {
          console.log(error)
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [id, queryClient])

  return <PartiesContext.Provider value={partiesQuery}>{children}</PartiesContext.Provider>
}
