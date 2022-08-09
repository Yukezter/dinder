import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider, QueryClient, QueryCache, MutationCache } from 'react-query'
import { ThemeProvider } from '@mui/material'
import smoothscroll from 'smoothscroll-polyfill'

import theme from './style/theme'
import { AuthProvider } from './context/AuthContext'
import Routes from './routes'

// Polyfill for smooth scrolling
smoothscroll.polyfill()

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
  React.useEffect(() => {
    const setViewportProperty = (el: HTMLElement) => {
      let prevClientHeight: number
      const minHeight = window.screen.availHeight - (window.outerHeight - window.innerHeight)
      console.log(window.screen.availHeight, window.outerHeight, window.innerHeight)
      el.style.setProperty('--app-height-min', `${minHeight}px`)

      const handleResize = () => {
        const clientHeight = window.innerHeight
        if (clientHeight === prevClientHeight) return
        requestAnimationFrame(() => {
          el.style.setProperty('--app-height', `${clientHeight}px`)
          const newMinHeight = window.screen.availHeight - (window.outerHeight - clientHeight)
          el.style.setProperty('--app-height-min', `${newMinHeight}px`)
          prevClientHeight = clientHeight
        })
      }

      handleResize()

      return handleResize
    }

    const handleResize = setViewportProperty(document.documentElement)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            '--app-height': '100%',
            '--app-height-max': '100%',
          },
          body: {
            '& > div#root': {
              display: 'flex',
              minHeight: 'var(--app-height, 100vh)',
            },
          },
        }}
      />
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

// const defaultQueryFn: QueryFunction = async ({ queryKey, signal }) => {
//   try {
//     const { data } = await api.cloud.get(queryKey[0] as string, {
//       signal,
//     })

//     return data
//   } catch (err) {
//     console.log(err)
//     throw err
//   }
// }
