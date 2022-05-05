import React from 'react'
import { Timestamp } from 'firebase/firestore'
import { useQuery, useQueryClient, UseQueryResult } from 'react-query'

// import { usersService } from '../services'
import { UsersService } from '../services/users'
import { PartiesService } from '../services/parties'
import { IAuthContext } from '../context/AuthContext'

const sleepThenThrow = (ms: number = 3000) =>
  new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error()), ms)
  })

export type OnlineStatus = {
  [userId: string]: {
    state: 'online' | 'offline'
    lastOnline?: string
  }
}

export type Username = { userId: string }

export type User = {
  uid: string
  photoURL: string
  name: string
  username: string
  about: string
}

export type Contacts = { [userId: string]: boolean }

export interface Business {
  type: 'save' | 'block'
  id: string
  details: {
    image: string
    name: string
    price: string
    rating: number
    categories: string
    reviews: number
    location: string
    url: string
  }
}

export type Match = {
  type: 'like' | 'super-like'
  id: string
  createdAt: Timestamp
  details: Business['details']
  lastToSwipe: string
}

export type Businesses = {
  [yelpId: string]: Business
}

export interface Party {
  id: string
  name: string
  admin: string
  members: string[]
  active: boolean
  lastActive: Timestamp
  createdAt: Timestamp
  location: {
    place_id: string
    description: string
    latitude: number
    longitude: number
  }
  params: {
    radius: number
    price: number
    categories: string[]
    openNow?: boolean
  }
}

export interface PopulatedParty extends Omit<Party, 'members'> {
  members: User[]
}

export type SwipeAction = 'undo' | 'dislike' | 'super-like' | 'like'

export interface Swipes {
  [userId: string]: {
    action: SwipeAction
    timestamp: Timestamp
  }
}

export type YelpBusiness = {
  rating: number
  price: string
  phone: string
  id: string
  alias: string
  is_closed: boolean
  categories: {
    alias: string
    title: string
  }[]
  review_count: number
  name: string
  url: string
  coordinates: {
    latitude: number
    longitude: number
  }
  image_url: string
  location: {
    city: string
    country: string
    address1: string
    address2?: string
    address3?: string
    state: string
    zip_code: number
  }
  distance: number
  transactions: string[]
}

export type YelpResponse = {
  total: number
  businesses: YelpBusiness[]
  region: {
    center: {
      latitude: number
      longitude: number
    }
  }
}

const UserContext = React.createContext<User>({} as User)
export const useUser = () => React.useContext(UserContext)

export const UserProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props
  const [user, setUser] = React.useState<User>()

  React.useEffect(() => {
    if (!id) {
      return
    }

    const userRef = UsersService.doc.user(id)
    const unsubscribe = UsersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data()
      setUser(data)
    })

    return () => {
      unsubscribe()
    }
  }, [id])

  return <UserContext.Provider value={user!}>{children}</UserContext.Provider>
}

const ContactsContext = React.createContext<Contacts | undefined>(undefined)
export const useContacts = () => React.useContext(ContactsContext)

export const ContactsProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props
  const [contacts, setContacts] = React.useState<Contacts>()

  React.useEffect(() => {
    if (!id) {
      return
    }

    const userRef = UsersService.doc.contacts(id)
    const unsubscribe = UsersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data() || {}
      setContacts(data)
    })

    return () => {
      unsubscribe()
    }
  }, [id])

  return (
    <ContactsContext.Provider value={contacts}>
      {children}
    </ContactsContext.Provider>
  )
}

const PartiesContext = React.createContext<
  UseQueryResult<PopulatedParty[], unknown>
>({} as UseQueryResult<PopulatedParty[], unknown>)
export const useParties = () => React.useContext(PartiesContext)

export const PartiesProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props

  if (!id) {
    throw new Error('No user id provided!')
  }

  const queryClient = useQueryClient()
  const parties = useQuery<PopulatedParty[]>(
    'parties',
    () => new Promise<PopulatedParty[]>(() => {}),
    {
      placeholderData: [...Array(3).fill(undefined), ...Array(5).fill({})],
      keepPreviousData: true,
      cacheTime: 10 * 60 * 1000,
    }
  )

  React.useEffect(() => {
    const partiesCollection = PartiesService.collection.parties()
    const q = partiesCollection.where('members', 'array-contains', id).query()
    const unsubscribe = UsersService.onCollectionSnapshot(q, snapshot => {
      const newParties = snapshot.docs.map(doc => doc.data()).filter(Boolean)

      const populateParties = async () => {
        const partiesWithMembers = []
        for (const party of newParties) {
          const members = await UsersService.getUsers(party.members)
          partiesWithMembers.push({
            ...party,
            members: members.docs.map(member => member.data()),
          })
        }

        queryClient.setQueryData('parties', partiesWithMembers)
      }

      populateParties().catch(error => {
        console.log(error)
      })
    })

    return () => {
      unsubscribe()
    }
  }, [id, queryClient])

  return (
    <PartiesContext.Provider value={parties}>
      {children}
    </PartiesContext.Provider>
  )
}

export type BusinessesData = { saved: Business[]; blocked: Business[] }

const BusinessesContext = React.createContext<UseQueryResult<BusinessesData>>(
  {} as UseQueryResult<BusinessesData>
)
export const useBusinesses = () => React.useContext(BusinessesContext)

export const BusinessesProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props

  if (!id) {
    throw new Error('No user id provided!')
  }

  const queryClient = useQueryClient()
  const businesses = useQuery<Business[], unknown, BusinessesData>(
    'businesses',
    () => new Promise<Business[]>(() => {}),
    {
      select(data) {
        const sorted = data.sort((a, b) => {
          if (a.details.name < b.details.name) {
            return -1
          }
          if (a.details.name > b.details.name) {
            return 1
          }
          return 0
        })
        return {
          saved: sorted.filter(business => business.type === 'save'),
          blocked: sorted.filter(business => business.type === 'block'),
        }
      },
      cacheTime: 10 * 60 * 1000,
    }
  )

  React.useEffect(() => {
    const businessesRef = UsersService.collection.businesses(id).ref
    const unsubscribe = UsersService.onCollectionSnapshot(
      businessesRef,
      snapshot => {
        const newBusinesses = snapshot.docs
          .map(doc => doc.data())
          .filter(Boolean)
        queryClient.setQueryData('businesses', newBusinesses)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [id, queryClient])

  return (
    <BusinessesContext.Provider value={businesses}>
      {children}
    </BusinessesContext.Provider>
  )
}

type PresenceContextProps = {
  usersOnline: OnlineStatus
  isOnline: (id?: string) => boolean
}

const PresenceContext = React.createContext<PresenceContextProps>(
  {} as PresenceContextProps
)
export const usePresence = () => React.useContext(PresenceContext)

export const PresenceProvider: React.FC = props => {
  const { children } = props
  const [usersOnline, setUsersOnline] = React.useState<OnlineStatus>({})

  const isOnline = React.useCallback(
    (id?: string) => {
      return !!id && usersOnline[id] && usersOnline[id].state === 'online'
    },
    [usersOnline]
  )

  React.useEffect(() => {
    const statusRef = UsersService.collection.status().ref
    const unsubscribe = UsersService.onCollectionSnapshot(
      statusRef,
      snapshot => {
        const data = snapshot.docs.reduce<OnlineStatus>((all, doc) => {
          if (doc.exists()) {
            const status = doc.data()
            all[doc.id] = {
              state: 'offline',
              ...status,
            }
          }
          return all
        }, {})

        setUsersOnline(data)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <PresenceContext.Provider value={{ usersOnline, isOnline }}>
      {children}
    </PresenceContext.Provider>
  )
}

const Loading: React.FC = ({ children }) => {
  const user = useUser()
  const contacts = useContacts()
  const parties = useParties()

  if (!user || !contacts || !parties) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}

type FirestoreProvidersProps = {
  auth: Required<IAuthContext>
}

export const FirestoreProviders: React.FC<FirestoreProvidersProps> = props => {
  const { auth, children } = props

  return (
    <UserProvider id={auth.user.uid}>
      <ContactsProvider id={auth.user.uid}>
        <PartiesProvider id={auth.user.uid}>
          <BusinessesProvider id={auth.user.uid}>
            <PresenceProvider>
              <Loading>{children}</Loading>
            </PresenceProvider>
          </BusinessesProvider>
        </PartiesProvider>
      </ContactsProvider>
    </UserProvider>
  )
}
