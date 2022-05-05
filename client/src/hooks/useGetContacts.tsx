import { useQuery, UseQueryOptions } from 'react-query'

import { UsersService } from '../services/users'
import { useContacts, User } from '../context/FirestoreContext'

const useGetContacts = (options: UseQueryOptions<User[]> = {}) => {
  const contacts = useContacts()

  return useQuery<User[]>(
    'contacts',
    async () => {
      if (!contacts || Object.keys(contacts).length === 0) {
        return []
      }

      const snap = await UsersService.getUsers(Object.keys(contacts))
      return snap.docs.map(doc => doc.data())
    },
    {
      keepPreviousData: true,
      staleTime: 60 * 1000,
      select(data) {
        return data.sort((a, b) => {
          if (a.name < b.name) {
            return -1
          }
          if (a.name > b.name) {
            return 1
          }
          return 0
        })
      },
      ...options,
    }
  )
}

export default useGetContacts
