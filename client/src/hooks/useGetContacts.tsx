import { useQuery, UseQueryOptions } from 'react-query'

import { Contacts } from '../types'
import { UsersService } from '../services/users'
import { userKeys } from '../utils/queryKeys'

export const useGetContacts = <T extends unknown = Contacts>(
  options: UseQueryOptions<Contacts, unknown, T> = {}
) => {
  return useQuery<Contacts, unknown, T>(
    userKeys.contacts.all(),
    async () => {
      const contacts = await UsersService.getContacts()
      const contactIds = Object.keys(contacts)
      const users = await UsersService.getUsers(contactIds)
      return {
        added: users.filter(contact => contacts[contact.uid] === true),
        blocked: users.filter(contact => contacts[contact.uid] === false),
      }
    },
    {
      cacheTime: 60 * 60 * 1000,
      staleTime: Infinity,
      ...options,
    }
  )
}
