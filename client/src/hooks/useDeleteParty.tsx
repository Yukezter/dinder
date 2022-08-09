import { useMutation, useQueryClient } from 'react-query'
import { useSnackbar, SnackbarKey } from 'notistack'

import { PopulatedParty } from '../types'
import { PartiesService } from '../services/parties'
import { partyKeys } from '../utils/queryKeys'

type Context = { snackbarKey: SnackbarKey }

export const useDeleteParty = () => {
  const queryClient = useQueryClient()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  return useMutation<void, unknown, PopulatedParty, Context>(
    async data => PartiesService.leaveParty(data.id),
    {
      onMutate: async data => {
        const snackbarKey = enqueueSnackbar('Deleting party...', {
          persist: true,
        })

        const queryKey = partyKeys.details()
        const previousParties = queryClient.getQueryData<PopulatedParty[]>(queryKey)

        if (previousParties) {
          const newParties = previousParties.filter(party => party.id !== data.id)
          queryClient.setQueryData<PopulatedParty[]>(queryKey, newParties)
        }

        // const partyKey = partyKeys.party(user.uid, party?.id)
        // queryClient.removeQueries(partyKey)

        return { snackbarKey }
      },
      onSuccess: (data, variables, context) => {
        closeSnackbar(context.snackbarKey)
        enqueueSnackbar('Party successfully deleted', {
          variant: 'success',
        })
      },
      onError: (error, data, context) => {
        closeSnackbar(context?.snackbarKey)
        enqueueSnackbar('Unable to delete party!', {
          variant: 'error',
        })

        const queryKey = partyKeys.details()
        queryClient.setQueryData<PopulatedParty[]>(queryKey, (prevParties = []) => {
          return [...prevParties, data]
        })
      },
    }
  )
}
