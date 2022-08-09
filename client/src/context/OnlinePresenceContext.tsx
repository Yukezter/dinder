import React from 'react'

import { OnlineStatus } from '../types'
import { UsersService } from '../services/users'

type PresenceContextProps = {
  usersOnline: OnlineStatus
  isOnline: (id?: string) => boolean
}

const PresenceContext = React.createContext<PresenceContextProps>({} as PresenceContextProps)
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
    const unsubscribe = UsersService.onCollectionSnapshot(statusRef, snapshot => {
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
    })

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
