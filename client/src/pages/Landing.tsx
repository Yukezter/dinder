import { AuthErrorCodes } from 'firebase/auth'
import React from 'react'
import { AuthError } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import GlobalStyles from '@mui/material/GlobalStyles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Hidden from '@mui/material/Hidden'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import { AuthService } from '../services/auth'
import { getAuthErrorMessage } from '../errors'
import { useAuth } from '../context/AuthContext'
import { Button, FormAlert, TextField, FormPaper, IconButton } from '../common/components'

type SignUpFormInputs = {
  email: string
  password: string
}

const SignUp: React.FC = () => {
  const form = useForm<SignUpFormInputs>({ mode: 'onChange' })

  const [checked, setChecked] = React.useState(false)

  const signUp = useMutation<void, AuthError, SignUpFormInputs>(
    async data => {
      return AuthService.signUp(data.email, data.password)
    },
    {
      onError(error) {
        if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
          form.setError('email', {
            message: getAuthErrorMessage(error.code),
          })
        } else if (error.code === AuthErrorCodes.INVALID_EMAIL) {
          form.setError('email', {
            message: getAuthErrorMessage(error.code),
          })
        } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
          form.setError('password', {
            message: getAuthErrorMessage(error.code),
          })
        }
      },
    }
  )

  const onSubmit: SubmitHandler<SignUpFormInputs> = data => {
    signUp.mutate(data)
  }

  const isLoading = signUp.isLoading || signUp.isSuccess
  const isDisabled = !form.formState.isValid || !checked

  return (
    <>
      <Typography variant='h5' mb={3}>
        Create an account!
      </Typography>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextField
          id='email'
          label='Email'
          fullWidth
          {...form.register('email', { required: true })}
          error={!!form.formState.errors.email}
          helperText={form.formState.errors.email?.message}
          disabled={isLoading}
        />
        <TextField
          id='password'
          label='Password'
          fullWidth
          {...form.register('password', { required: true })}
          type='password'
          disabled={isLoading}
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
        />
        <FormControlLabel
          disabled={isLoading}
          control={
            <Checkbox
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              inputProps={{ 'aria-label': 'Agreement' }}
            />
          }
          label={
            <Typography variant='caption' ml={1}>
              <span>I agree to the </span>
              <Box component='span' sx={{ color: 'primary.main' }}>
                Terms of Service
              </Box>
              <span> and </span>
              <Box component='span' sx={{ color: 'primary.main' }}>
                Privacy Policy
              </Box>
            </Typography>
          }
          sx={{ mb: 2 }}
        />
        <Button type='submit' fullWidth loading={isLoading} disabled={isDisabled}>
          Create Account
        </Button>
      </form>
    </>
  )
}

type SignInFormInputs = {
  email: string
  password: string
}

const SignIn: React.FC = () => {
  const form = useForm<SignInFormInputs>({ mode: 'onChange' })

  const checkboxRef = React.useRef<HTMLInputElement>(null)

  const signIn = useMutation<void, AuthError, SignInFormInputs>(
    async ({ email, password }) => {
      await AuthService.signIn(email, password)
    },
    {
      onError(error) {
        if (error.code === AuthErrorCodes.USER_DELETED) {
          form.setError('email', {
            message: getAuthErrorMessage(error.code),
          })
        } else if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
          form.setError('password', {
            message: getAuthErrorMessage(error.code),
          })
        }
      },
    }
  )

  const onSubmit: SubmitHandler<SignInFormInputs> = async data => {
    const checked = checkboxRef.current?.value
    await AuthService.setPersistence(checked ? 'LOCAL' : 'SESSION')
    signIn.mutate(data)
  }

  const isLoading = signIn.isLoading || signIn.isSuccess
  const isDisabled = !form.formState.isValid

  return (
    <>
      <Typography variant='h5' mb={3}>
        Welcome back!
      </Typography>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextField
          id='email'
          label='Email or username'
          fullWidth
          {...form.register('email', { required: true })}
          error={!!form.formState.errors.email}
          helperText={form.formState.errors.email?.message}
          disabled={isLoading}
        />
        <TextField
          type='password'
          id='password'
          label='Password'
          fullWidth
          {...form.register('password', { required: true })}
          error={!!form.formState.errors.password}
          helperText={form.formState.errors.password?.message}
          disabled={isLoading}
        />
        <FormControlLabel
          control={
            <Checkbox inputRef={checkboxRef} inputProps={{ 'aria-label': 'Remember me?' }} />
          }
          label={<Typography variant='caption'>Remember me?</Typography>}
          sx={{ mb: 2 }}
        />
        <Button type='submit' fullWidth loading={isLoading} disabled={isDisabled}>
          Sign In
        </Button>
      </form>
    </>
  )
}

const AuthForm: React.FC = () => {
  const [formType, setFormType] = React.useState<0 | 1>(0)

  const handleChange = (e: any, value: 0 | 1) => {
    if (value !== null) {
      setFormType(value)
    }
  }

  return (
    <>
      <Box height='100%' display='flex' justifyContent='center' alignItems='center'>
        <ToggleButtonGroup
          color='primary'
          value={formType}
          exclusive
          size='small'
          onChange={handleChange}
          sx={{ mb: 2.5 }}
        >
          <ToggleButton value={0}>Sign Up</ToggleButton>
          <ToggleButton value={1}>Sign In</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {formType === 0 && <SignUp />}
      {formType === 1 && <SignIn />}
    </>
  )
}

const Typewriter = () => {
  const [text, setText] = React.useState('')
  const charIndex = React.useRef(1)
  const [isDone, setIsDone] = React.useState(false)

  React.useEffect(() => {
    const allText = 'Discover eateries faster than ever...'

    const tick = () => {
      if (charIndex.current <= allText.length) {
        setText(allText.slice(0, charIndex.current))
        ++charIndex.current
        const delta = 150 - Math.random() * 100
        setTimeout(() => {
          tick()
        }, delta)
      } else {
        setIsDone(true)
      }
    }

    tick()
  }, [])

  return (
    <>
      <Typography
        variant='h3'
        color='inherit'
        fontWeight={700}
        gutterBottom
        maxWidth={{ xs: 400, md: 600 }}
      >
        {text}
        <Box
          component='span'
          sx={{
            borderRight: '1px solid white',
            ...(isDone && {
              animation: 'blink 0.8s steps(5, start) infinite',
            }),
            '@keyframes blink': {
              to: { visibility: 'hidden' },
            },
          }}
        />
      </Typography>
      <Typography
        component='div'
        variant='body1'
        color='inherit'
        sx={{
          opacity: 0,
          ...(isDone && {
            animation: 'show 200ms forwards',
          }),
          '@keyframes show': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        Invite friends, swipe through restaurants, and match!
      </Typography>
    </>
  )
}

export const Landing = () => {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to='/dashboard' replace />
  }

  const scrollToBottom = () => {
    const scrollEl = document.scrollingElement || document.body
    scrollEl?.scrollTo({ top: scrollEl?.scrollHeight, behavior: 'smooth' })
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
      <Container sx={{ minHeight: '100%', position: 'relative' }}>
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
                <span>Dinder</span>
                <LocalDiningTwoToneIcon />
              </Box>
            </Typography>
          </Toolbar>
        </AppBar>
        <Grid container height='100%'>
          <Grid
            item
            xs={12}
            md={6}
            container
            height={{ xs: 'var(--app-height, 100vh)', md: 'auto' }}
            position='relative'
          >
            <Box m='auto' mr={{ md: 'unset' }} color='white' display='inline'>
              <Typewriter />
            </Box>
            <Hidden mdUp>
              <Box
                display='flex'
                justifyContent='center'
                position='absolute'
                bottom={16}
                left={0}
                right={0}
                sx={{
                  transform: 'translateY(0)',
                  animation: 'bounce 2s infinite',
                  '@keyframes bounce': {
                    '0%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(8px)' },
                    '100%': { transform: 'translateY(0)' },
                  },
                }}
              >
                <IconButton
                  size='small'
                  sx={{ mx: 'auto', color: 'white' }}
                  onClick={scrollToBottom}
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </Box>
            </Hidden>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            container
            height={{ xs: 'var(--app-height, 100vh)', md: 'auto' }}
          >
            <Box m='auto'>
              <FormPaper>
                <AuthForm />
              </FormPaper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}
