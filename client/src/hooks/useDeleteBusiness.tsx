import { FieldValue, Timestamp } from 'firebase/firestore'
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query'

import { usersService } from '../services'
import { useUser, Business } from '../context/FirestoreContext'

const useDeleteBusiness = (
  options?: UseMutationOptions<void, unknown, Business>
) => {
  const queryClient = useQueryClient()
  const user = useUser()
  return useMutation<void, unknown, Business>(
    data => usersService.deleteBusiness(user.uid, data.id),
    {
      onMutate(data) {
        const oldData = queryClient.getQueryData<Business[]>('businesses')!
        const newData = oldData.filter(({ id }) => id !== data.id)
        queryClient.setQueryData<Business[]>('businesses', newData)
      },
      onError(error, data) {
        const oldData = queryClient.getQueryData<Business[]>('businesses')!
        const newData = [data, ...oldData]
        queryClient.setQueryData<Business[]>('businesses', newData)
      },
    }
  )
}

export default useDeleteBusiness