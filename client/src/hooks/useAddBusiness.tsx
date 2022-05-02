import { useMutation, UseMutationOptions, useQueryClient } from 'react-query'

import { usersService } from '../services'
import { useUser, Business } from '../context/FirestoreContext'

const useAddBusiness = (
  options?: UseMutationOptions<void, unknown, Business>
) => {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation<void, unknown, Business, Business | undefined>(
    data => usersService.addBusiness(user.uid, data),
    {
      onMutate(data) {
        const oldData = queryClient.getQueryData<Business[]>('businesses')!
        const oldBusiness = oldData.find(({ id }) => id === data.id)
        const newData = [data, ...oldData.filter(({ id }) => id !== data.id)]

        queryClient.setQueryData<Business[]>('businesses', newData)

        if (oldBusiness) {
          return oldBusiness
        }
      },
      onError(error, data, oldBusiness) {
        const currentData = queryClient.getQueryData<Business[]>('businesses')!
        const newData = currentData.filter(({ id }) => id !== data.id)

        if (oldBusiness) {
          newData.unshift(oldBusiness)
        }

        queryClient.setQueryData<Business[]>('businesses', newData)
      },
    }
  )
}

export default useAddBusiness
