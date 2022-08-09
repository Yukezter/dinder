import { useMutation, useQueryClient, QueryKey } from 'react-query'
import { FirestoreError } from 'firebase/firestore'
import produce from 'immer'

import { User, Contacts } from '../types'
import { UsersService } from '../services/users'
import { userKeys } from '../utils/queryKeys'

type Context = { queryKey: QueryKey; previousContacts: Contacts }

export const useBlockUser = () => {
  const queryClient = useQueryClient()

  return useMutation<string, FirestoreError, User, Context>(
    async data => UsersService.blockUser(data.uid),
    {
      onMutate: async data => {
        const queryKey = userKeys.contacts.all()
        await queryClient.cancelQueries(queryKey)

        const previousContacts = queryClient.getQueryData<Contacts>(queryKey)
        if (previousContacts) {
          const newContacts = produce(previousContacts, draft => {
            draft.added = draft.added.filter(contact => contact.uid !== data.uid)
            draft.blocked.push(data)
          })

          queryClient.setQueryData<Contacts>(queryKey, newContacts)
          return { queryKey, previousContacts }
        }
      },
      onError: (error, variables, context) => {
        if (context) {
          const { queryKey, previousContacts } = context
          queryClient.setQueryData<Contacts>(queryKey, previousContacts)
        }
      },
      onSettled: (data, error, variables, context) => {
        if (context) {
          queryClient.invalidateQueries(context.queryKey)
        }
      },
    }
  )
}
