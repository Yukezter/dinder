import React from 'react'

import { User } from '../types'
import { UsersService } from '../services/users'

const UserContext = React.createContext<User>({} as User)

export const useUser = () => React.useContext(UserContext)

export const UserProvider: React.FC<{ id: string }> = props => {
  const { children, id } = props

  if (!id) {
    throw new Error('No user id provided!')
  }

  const [user, setUser] = React.useState<User>()

  React.useEffect(() => {
    const userRef = UsersService.doc.user(id)
    const unsubscribe = UsersService.onDocumentSnapshot(userRef, snapshot => {
      const data = snapshot.data() || ({} as User)
      setUser(data)
    })

    return () => {
      unsubscribe()
    }
  }, [id])

  return <UserContext.Provider value={user!}>{children}</UserContext.Provider>
}
