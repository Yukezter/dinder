import {
  RouteObject,
  useRoutes,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom'
import GlobalStyles from '@mui/material/GlobalStyles'
import Box from '@mui/material/Box'
import Zoom from '@mui/material/Zoom'
import { TransitionProps } from '@mui/material/transitions'
import { SnackbarProvider } from 'notistack'

import { FinishAccountSetup } from '../components'
import { useAuth, IAuthContext } from '../context/AuthContext'
import { FirestoreProviders } from '../context/FirestoreContext'
import { ProfileViewProvider } from '../context/ProfileViewContext'
import { PartySettingsProvider } from '../context/PartySettingsContext'
import { Landing, DashboardLayout, Dashboard, Settings, Party } from '../pages'
import {
  GeneralSettings,
  PersonalSettings,
  PasswordSettings,
} from '../pages/Dashboard/Settings'

const ProtectedRoute = () => {
  const location = useLocation()
  const auth = useAuth()

  if (!auth.user || auth.claims?.accessLevel === undefined) {
    return <Navigate to='/' state={{ from: location }} />
  }

  if (auth.claims?.accessLevel === 0) {
    return <FinishAccountSetup />
  }

  return (
    <FirestoreProviders auth={auth as Required<IAuthContext>}>
      <PartySettingsProvider>
        <ProfileViewProvider>
          <SnackbarProvider
            maxSnack={1}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            TransitionComponent={Zoom as React.ComponentType<TransitionProps>}
          >
            <DashboardLayout>
              <Outlet context={{ auth } as { auth: Required<IAuthContext> }} />
            </DashboardLayout>
          </SnackbarProvider>
        </ProfileViewProvider>
      </PartySettingsProvider>
    </FirestoreProviders>
  )
}

const Routes = () => {
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <Landing />,
    },
    {
      path: '/*',
      element: (
        <Box height='100vh' display='flex'>
          <GlobalStyles
            styles={{
              body: { background: '#f8fafb' },
            }}
          />
          <ProtectedRoute />
        </Box>
      ),
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />,
        },
        {
          element: <Settings />,
          children: [
            {
              path: 'settings/general',
              element: <GeneralSettings />,
            },
            {
              path: 'settings/personal',
              element: <PersonalSettings />,
            },
            {
              path: 'settings/password',
              element: <PasswordSettings />,
            },
          ],
        },
        {
          path: 'party/:partyId/*',
          children: [
            {
              index: true,
              element: <Party />,
            },
          ],
        },
        {
          path: '*',
          element: 'No match bro!',
        },
      ],
    },
    {
      path: '*',
      element: 'No Match',
    },
  ]

  const element = useRoutes(routes)
  return element
}

export default Routes
