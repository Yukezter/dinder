import { useMutation, useQueryClient } from 'react-query'
import { FirestoreError } from 'firebase/firestore'

import { usersService } from '../services'
import { User } from '../context/FirestoreContext'

const useDeleteContactMuation = (user?: User) => {
  const queryClient = useQueryClient()
  return useMutation<string, FirestoreError, User, User[]>(
    async data => usersService.deleteContact(data.uid),
    {
      mutationKey: ['contacts', user?.uid],
      async onMutate(data) {
        const queryKey = 'contacts'

        await queryClient.cancelQueries(queryKey)
        const previousContacts = queryClient.getQueryData<User[]>(queryKey)
        queryClient.setQueryData<User[]>(queryKey, (oldContacts = []) => {
          return oldContacts!.filter(({ uid }) => uid !== data.uid)
        })

        return previousContacts
      },
      onError(error, variables, previousContacts) {
        queryClient.setQueryData('contacts', previousContacts)
      },
      onSettled: (data, error, variables) => {
        // const isMutating = queryClient.isMutating({
        //   mutationKey: ['contacts', variables.uid],
        // })
        // if (isMutating) {
        //   queryClient.invalidateQueries('contacts')
        // }
      },
    }
  )
}

export default useDeleteContactMuation
