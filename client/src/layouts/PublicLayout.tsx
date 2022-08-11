import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import GlobalStyles from '@mui/material/GlobalStyles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import { useAuth } from '../context/AuthContext'
import { BrandNameLink } from '../common/components'

export const PublicLayout: React.FC = () => {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to='/dashboard' replace />
  }

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            background: 'linear-gradient(#de59a9, #fa6715)',
          },
        }}
      />
      <AppBar position='absolute' color='transparent' elevation={0}>
        <Toolbar>
          <Typography
            variant='h6'
            fontWeight={800}
            color='white'
            display='inline-block'
            width='auto'
            mx='auto'
            py={2}
          >
            <Box display='flex' alignItems='center'>
              <BrandNameLink to='/' />
            </Box>
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ flex: 1, display: 'flex' }}>
        <Outlet />
      </Container>
    </>
  )
}
