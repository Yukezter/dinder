/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Username, User, Contacts, Party, Members, Offsets, Swipes, Match } from './types'
import { getColRef } from './utils/db'

export const database = {}

export const firestore = {
  usernames: getColRef<Username>('usernames'),
  users: getColRef<User>('users'),
  contacts: getColRef<Contacts>('contacts'),
  parties: getColRef<Party>('parties'),
  members: getColRef<Members>('members'),
  matches: (id: string) => getColRef<Match>(`parties/${id}/matches`),
  swipes: (id: string) => getColRef<Swipes>(`parties/${id}/swipes`),
  offsets: getColRef<Offsets>('offsets'),
}
