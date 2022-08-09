import React from 'react'
import produce, { Draft } from 'immer'

import { User, PopulatedParty, Party } from '../types'

interface UIState {
  isContactsMenuOpen: boolean
  isProfileDialogOpen: boolean
  profileOwner: User | null
  isPartySettingsOpen: boolean
  settings: Partial<PopulatedParty> | null
}

export interface IUIContext {
  contacts: {
    isOpen: boolean
    toggle: () => void
    close: () => void
  }
  profile: {
    owner: User | null
    isOpen: boolean
    open: (user?: User) => void
    close: () => void
    clear: () => void
  }
  party: {
    settings: UIState['settings']
    isOpen: boolean
    open: (party?: Partial<PopulatedParty>) => void
    close: () => void
    clear: () => void
  }
}

const UIContext = React.createContext<IUIContext>({} as IUIContext)

export const useUIContext = () => React.useContext(UIContext)

export const UIContextProvider: React.FC = ({ children }) => {
  const [state, setState] = React.useState<UIState>({
    isContactsMenuOpen: false,
    isProfileDialogOpen: false,
    profileOwner: null,
    isPartySettingsOpen: false,
    settings: null,
  })

  const update = React.useCallback((cb: (draft: Draft<UIState>) => void) => {
    setState(produce(cb))
  }, [])

  const toggleContactsMenu = React.useCallback(() => {
    update(prevState => {
      prevState.isContactsMenuOpen = !prevState.isContactsMenuOpen
    })
  }, [update])

  const closeContactsMenu = React.useCallback(() => {
    update(prevState => {
      prevState.isContactsMenuOpen = false
    })
  }, [update])

  const openProfileDialog = React.useCallback(
    (user?: User) => {
      if (user) {
        update(prevState => {
          prevState.isProfileDialogOpen = true
          prevState.profileOwner = user
        })
      }
    },
    [update]
  )

  const closeProfileDialog = React.useCallback(() => {
    update(prevState => {
      prevState.isProfileDialogOpen = false
    })
  }, [update])

  const clearProfileOwner = React.useCallback(() => {
    update(prevState => {
      prevState.profileOwner = null
    })
  }, [update])

  const openPartySettings = React.useCallback<IUIContext['party']['open']>(
    (party = {}) => {
      update(prevState => {
        prevState.isProfileDialogOpen = false
        prevState.isPartySettingsOpen = true
        prevState.settings = party
      })
    },
    [update]
  )

  const closePartySettings = React.useCallback(() => {
    update(prevState => {
      prevState.isPartySettingsOpen = false
    })
  }, [update])

  const clearParty = React.useCallback(() => {
    update(prevState => {
      prevState.settings = null
    })
  }, [update])

  const value = React.useMemo(
    () => ({
      contacts: {
        isOpen: state.isContactsMenuOpen,
        toggle: toggleContactsMenu,
        close: closeContactsMenu,
      },
      profile: {
        owner: state.profileOwner,
        isOpen: state.isProfileDialogOpen,
        open: openProfileDialog,
        close: closeProfileDialog,
        clear: clearProfileOwner,
      },
      party: {
        settings: state.settings,
        isOpen: state.isPartySettingsOpen,
        open: openPartySettings,
        close: closePartySettings,
        clear: clearParty,
      },
    }),
    [
      state.isContactsMenuOpen,
      state.profileOwner,
      state.isProfileDialogOpen,
      state.isPartySettingsOpen,
      state.settings,
      toggleContactsMenu,
      closeContactsMenu,
      openProfileDialog,
      closeProfileDialog,
      clearProfileOwner,
      openPartySettings,
      closePartySettings,
      clearParty,
    ]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
