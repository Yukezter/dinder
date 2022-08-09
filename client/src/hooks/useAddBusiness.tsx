import { useMutation, UseMutationOptions, useQueryClient, QueryKey } from 'react-query'

import { Business } from '../types'
import { UsersService } from '../services/users'
import { userKeys } from '../utils/queryKeys'

type VBusiness = Omit<Business, 'createdAt'>

type Context = { previousBusinesses: VBusiness[]; queryKey: QueryKey }

export const useAddBusiness = (options?: UseMutationOptions<void, unknown, VBusiness, Context>) => {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, VBusiness, Context>(data => UsersService.addBusiness(data), {
    onMutate: async data => {
      const queryKey = userKeys.businesses.all()
      await queryClient.cancelQueries(queryKey)

      const previousBusinesses = queryClient.getQueryData<VBusiness[]>(queryKey)
      if (previousBusinesses) {
        const newBusinesses = [...previousBusinesses, data]
        queryClient.setQueryData<VBusiness[]>(queryKey, newBusinesses)

        return { previousBusinesses, queryKey }
      }
    },
    onError: (error, data, context) => {
      if (context) {
        const { queryKey, previousBusinesses } = context
        queryClient.setQueryData<VBusiness[]>(queryKey, previousBusinesses)
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
