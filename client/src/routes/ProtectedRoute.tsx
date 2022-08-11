import React from 'react'
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { useJsApiLoader, LoadScriptProps } from '@react-google-maps/api'
import GlobalStyles, { GlobalStylesProps } from '@mui/material/GlobalStyles'
import CircularProgress from '@mui/material/CircularProgress'

import {
  useAuth,
  UserProvider,
  useUser,
  PartiesProvider,
  useParties,
  PresenceProvider,
  SnackbarProvider,
  UIContextProvider,
} from '../context'
import { AccountSetupDialog, ProfileDialog, PartySettingsDrawer } from '../components'
import { PrivateLayout } from '../layouts/PrivateLayout'

const globalStyles: GlobalStylesProps['styles'] = {
  body: {
    background: '#fafafa',
  },
}

const googleApiLibraries: LoadScriptProps['libraries'] = ['places']

const LoadRequiredContexts: React.FC = ({ children }) => {
  const user = useUser()
  const parties = useParties()
  const googleMapsScript = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: googleApiLibraries,
  })

  if (!user || !parties || !googleMapsScript.isLoaded) {
    return <CircularProgress sx={{ m: 'auto' }} />
  }

  return <>{children}</>
}

const ProtectedRoute: React.FC = props => {
  const location = useLocation()
  const auth = useAuth()

  if (!auth.user) {
    return <Navigate to='/' state={{ from: location }} />
  }

  if (auth.claims?.accessLevel === undefined) {
    return <CircularProgress sx={{ m: 'auto' }} />
  }

  if (auth.claims?.accessLevel === 0) {
    return <AccountSetupDialog />
  }

  return (
    <UserProvider id={auth.user.uid}>
      <PartiesProvider id={auth.user.uid}>
        <PresenceProvider>
          <GlobalStyles styles={globalStyles} />
          <LoadRequiredContexts>
            <SnackbarProvider>
              <UIContextProvider>
                <ProfileDialog />
                <PartySettingsDrawer />
                <PrivateLayout>
                  <Outlet context={{ auth }} />
                </PrivateLayout>
              </UIContextProvider>
            </SnackbarProvider>
          </LoadRequiredContexts>
        </PresenceProvider>
      </PartiesProvider>
    </UserProvider>
  )
}

export default ProtectedRoute
