import {
  RouteObject,
  useRoutes,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom'
import GlobalStyles from '@mui/material/GlobalStyles'
import Zoom from '@mui/material/Zoom'
import { TransitionProps } from '@mui/material/transitions'
import CircularProgress from '@mui/material/CircularProgress'
import { SnackbarProvider } from 'notistack'

import { FinishAccountSetup } from '../components'
import { useAuth, IAuthContext } from '../context/AuthContext'
import { FirestoreProviders } from '../context/FirestoreContext'
import { ContactsMenuProvider } from '../context/ContactsMenuContext'
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

  if (!auth.user) {
    return <Navigate to='/' state={{ from: location }} />
  }

  if (auth.claims?.accessLevel === undefined) {
    return <CircularProgress sx={{ m: 'auto' }} />
  }

  if (auth.claims?.accessLevel === 0) {
    return <FinishAccountSetup />
  }

  return (
    <FirestoreProviders auth={auth as Required<IAuthContext>}>
      <PartySettingsProvider>
        <ContactsMenuProvider>
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
                <Outlet
                  context={{ auth } as { auth: Required<IAuthContext> }}
                />
              </DashboardLayout>
            </SnackbarProvider>
          </ProfileViewProvider>
        </ContactsMenuProvider>
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
        <>
          <GlobalStyles
            styles={{
              body: { background: '#fafafa' },
            }}
          />
          <ProtectedRoute />
        </>
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
          element: 'Page not found.',
        },
      ],
    },
    {
      path: '*',
      element: 'Page not found.',
    },
  ]

  const element = useRoutes(routes)
  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            '& > div#root': {
              display: 'flex',
              minHeight: 'var(--app-height, 100vh)',
            },
          },
        }}
      />
      {element}
    </>
  )
}

export default Routes
