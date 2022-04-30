import {
  RouteObject,
  useRoutes,
  useLocation,
  Navigate,
  Outlet,
} from 'react-router-dom'

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

  if (!auth.user) {
    return <Navigate to='/' state={{ from: location }} />
  }

  return (
    <FirestoreProviders auth={auth as Required<IAuthContext>}>
      <ProfileViewProvider>
        <PartySettingsProvider>
          <DashboardLayout>
            <Outlet />
            {/* <Outlet context={{ auth } as { auth: Required<IAuthContext> }} /> */}
          </DashboardLayout>
        </PartySettingsProvider>
      </ProfileViewProvider>
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
      element: <ProtectedRoute />,
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
