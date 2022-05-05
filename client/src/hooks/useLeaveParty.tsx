import { useMutation, useQueryClient } from 'react-query'

import { PartiesService } from '../services/parties'
import { PopulatedParty } from '../context/FirestoreContext'

const useLeaveParty = (party?: PopulatedParty) => {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, PopulatedParty>(
    async oldParty => PartiesService.leaveParty(oldParty.id),
    {
      mutationKey: ['parties', party?.id],
      async onMutate(oldParty) {
        await queryClient.cancelQueries('parties')

        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            return oldParties!.filter(({ id }) => id !== oldParty.id)
          }
        )
      },
      onError(data, oldParty) {
        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            return [...oldParties!, oldParty]
          }
        )
      },
    }
  )
}

export default useLeaveParty
