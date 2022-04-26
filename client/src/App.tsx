import React from 'react'
import { CssBaseline } from '@mui/material'
import { BrowserRouter } from 'react-router-dom'
import {
  QueryClientProvider,
  QueryClient,
  QueryFunction,
  QueryCache,
  MutationCache,
} from 'react-query'
import { ThemeProvider } from '@mui/material'

import theme from './style/theme'
import api from './app/api'
import { AuthProvider } from './context/AuthContext'
import Routes from './routes'

const defaultQueryFn: QueryFunction = async ({ queryKey, signal }) => {
  try {
    const { data } = await api.cloud.get(queryKey[0] as string, {
      signal,
    })

    return data
  } catch (err) {
    console.log(err)
    throw err
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: error => {
      console.dir(error)
    },
  }),
  mutationCache: new MutationCache({
    onError: error => {
      console.dir(error)
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: false,
      cacheTime: 0,
      staleTime: 0,
      retryOnMount: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
})

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
