import React from 'react'
import { User } from 'firebase/auth'

export type AuthUser = User

export interface IContactsContext {
  open: boolean
  close: () => void
  toggle: () => void
}

const ContactsContext = React.createContext<IContactsContext>(
  {} as IContactsContext
)

export const useContactsMenu = () => React.useContext(ContactsContext)

export const ContactsMenuProvider: React.FC = ({ children }) => {
  const [open, setOpen] = React.useState(false)

  const close = React.useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const toggle = React.useCallback(() => {
    setOpen(prevOpen => !prevOpen)
  }, [setOpen])

  return (
    <ContactsContext.Provider
      value={{
        open,
        close,
        toggle,
      }}
    >
      {children}
    </ContactsContext.Provider>
  )
}
