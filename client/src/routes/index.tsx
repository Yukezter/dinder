import { RouteObject, useRoutes, Navigate } from 'react-router-dom'

import ProtectedRoute from './ProtectedRoute'
import ProtectedPartyRoute from './ProtectedPartyRoute'
import {
  Landing,
  Dashboard,
  Party,
  Settings,
  GeneralSettings,
  PersonalSettings,
  PasswordSettings,
  Forbidden,
  NotFound,
} from '../pages'

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
          element: <ProtectedPartyRoute />,
          children: [
            {
              path: 'party/:partyId',
              element: <Party />,
            },
          ],
        },
        {
          path: '403',
          element: <Forbidden />,
        },
        {
          path: '404',
          element: <NotFound />,
        },
        {
          path: '*',
          element: <Navigate to='/404' replace />,
        },
      ],
    },
    {
      path: '*',
      element: 'Page not found.',
    },
  ]

  const element = useRoutes(routes)
  return element
}

export default Routes
