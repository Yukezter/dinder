import { useMutation, UseMutationOptions, useQueryClient } from 'react-query'
import produce from 'immer'
import { useSnackbar, SnackbarKey } from 'notistack'

import { UpdatePartyFields, PopulatedParty } from '../types'
import { PartiesService } from '../services/parties'
import { partyKeys } from '../utils/queryKeys'

type Context = {
  snackbarKey: SnackbarKey
  isNew: boolean
}

export const useUpdateParty = ({
  onMutate,
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<PopulatedParty, unknown, UpdatePartyFields, Context> = {}) => {
  const queryClient = useQueryClient()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  return useMutation<PopulatedParty, unknown, UpdatePartyFields, Context>(
    data => PartiesService.updateParty(data),
    {
      onMutate: variables => {
        const parties = queryClient.getQueryData<PopulatedParty[]>(partyKeys.details())
        const isNew = parties ? !parties.some(party => party.id === variables.id) : true
        const snackbarKey = enqueueSnackbar(`${isNew ? 'Creating' : 'Updating'} party...`, {
          persist: true,
        })

        if (onMutate) {
          onMutate(variables)
        }

        return { snackbarKey, isNew }
      },
      onSuccess: (data, variables, context) => {
        queryClient.setQueryData<PopulatedParty[]>(partyKeys.details(), (prevParties = []) => {
          const partyIndex = prevParties.findIndex(({ id }) => id === data.id)
          if (partyIndex === -1) {
            return [...prevParties, data]
          } else {
            return produce(prevParties, draft => {
              draft[partyIndex] = { ...data }
            })
          }
        })

        const partyKey = partyKeys.detail(data.id)
        queryClient.setQueryData<PopulatedParty>(partyKey, data)

        closeSnackbar(context.snackbarKey)
        enqueueSnackbar(`Party successfully ${context.isNew ? 'created' : 'updated'}!`, {
          variant: 'success',
        })

        if (onSuccess) {
          onSuccess(data, variables, context)
        }
      },
      onError: (error, varaibles, context) => {
        closeSnackbar(context?.snackbarKey)
        enqueueSnackbar(`Unable to ${context?.isNew ? 'create' : 'update'} party!`, {
          variant: 'error',
        })

        if (onError) {
          onError(error, varaibles, context)
        }
      },
      ...options,
    }
  )
}
