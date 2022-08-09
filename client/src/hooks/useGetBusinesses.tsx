import { useQuery, UseQueryOptions } from 'react-query'

import { Business } from '../types'
import { UsersService } from '../services/users'
import { userKeys } from '../utils/queryKeys'

export const useGetBusinesses = <T extends unknown = Business[]>(
  options?: UseQueryOptions<Business[], unknown, T>
) => {
  return useQuery<Business[], unknown, T>(
    userKeys.businesses.all(),
    () => UsersService.getBusinesses(),
    {
      cacheTime: 10 * 60 * 1000,
      ...options,
    }
  )
}
