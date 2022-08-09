import { QueryKey, useMutation, UseMutationOptions, useQueryClient } from 'react-query'

import { Business } from '../types'
import { UsersService } from '../services/users'
import { userKeys } from '../utils/queryKeys'

type Context = { previousBusinesses: Business[]; queryKey: QueryKey }

export const useDeleteBusiness = (options?: UseMutationOptions<void, unknown, string, Context>) => {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string, Context>(data => UsersService.deleteBusiness(data), {
    onMutate: async data => {
      const queryKey = userKeys.businesses.all()
      await queryClient.cancelQueries(queryKey)

      const previousBusinesses = queryClient.getQueryData<Business[]>(queryKey)
      if (previousBusinesses) {
        const newBusinesses = previousBusinesses.filter(business => business.details.id !== data)
        queryClient.setQueryData<Business[]>(queryKey, newBusinesses)

        return { previousBusinesses, queryKey }
      }
    },
    onError: (error, data, context) => {
      if (context) {
        const { queryKey, previousBusinesses } = context
        queryClient.setQueryData<Business[]>(queryKey, previousBusinesses)
      }
    },
    onSettled: (data, error, variables, context) => {
      if (context) {
        queryClient.invalidateQueries(context.queryKey)
      }
    },
    ...options,
  })
}
