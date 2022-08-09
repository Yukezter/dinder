import { PopulatedParty } from '../types'

export const userKeys = {
  all: ['user'] as const,
  contacts: {
    all: () => [...userKeys.all, 'contacts'] as const,
    add: (id?: string) => [...userKeys.contacts.all(), 'add', id] as const,
    delete: (id?: string) => [...userKeys.contacts.all(), 'delete', id] as const,
  },
  businesses: {
    all: () => [...userKeys.all, 'businesses'] as const,
    add: (id?: string) => [...userKeys.businesses.all(), 'add', id] as const,
    delete: (id?: string) => [...userKeys.businesses.all(), 'delete', id] as const,
  },
}

export const partyKeys = {
  all: ['parties'] as const,
  list: () => [...partyKeys.all, 'list'] as const,
  details: () => [...partyKeys.all, 'detail'] as const,
  detail: (id?: string) => [...partyKeys.details(), id] as const,
  members: (id?: string) => [...partyKeys.all, 'members', id] as const,
  businesses: ({ id, location, params }: PopulatedParty) =>
    [...partyKeys.all, 'businesses', id, location, params] as const,
  // businesses: ({ id, location, params }: PopulatedParty, offset?: number) =>
  //   [...partyKeys.all, 'businesses', id, location, params, offset] as const,
  offset: ({ id, location, params }: PopulatedParty) => [
    ...partyKeys.all,
    'offset',
    id,
    location,
    params,
  ],
  matches: (id?: string) => [...partyKeys.all, 'matches', id] as const,
}
