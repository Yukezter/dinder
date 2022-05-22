import React from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import { styled } from '@mui/material/styles'
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
import { useAuth } from '../context/AuthContext'
import {
  Button,
  FormAlert,
  TextField,
  FormPaper,
  IconButton,
} from '../common/components'

type SignUpFormInputs = {
  email: string
  password: string
}

const SignUp: React.FC = () => {
  const form = useForm<SignUpFormInputs>()
  const [checked, setChecked] = React.useState(false)

  const mutation = useMutation<void, Error, SignUpFormInputs>(async data => {
    return AuthService.signUp(data.email, data.password)
  })

  const onSubmit: SubmitHandler<SignUpFormInputs> = data => {
    mutation.mutate(data)
  }

  const isDisabled = mutation.isLoading || mutation.isSuccess

  return (
    <>
      <Typography variant='h5' mb={2}>
        Create an account!
      </Typography>
      {mutation.isError && (
        <FormAlert message={mutation.error.message} onClose={mutation.reset} />
      )}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextField
          {...form.register('email', {
            required: 'An email is required',
          })}
          disabled={isDisabled}
          id='email'
          label='Email'
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          {...form.register('password', {
            required: 'A password is required',
          })}
          type='password'
          disabled={isDisabled}
          id='password'
          label='Password'
          fullWidth
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          disabled={isDisabled}
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
        <Button
          type='submit'
          fullWidth
          loading={isDisabled}
          disabled={!checked}
        >
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
  const form = useForm<SignInFormInputs>()
  const checkboxRef = React.useRef<HTMLInputElement>(null)

  const mutation = useMutation<void, Error, SignInFormInputs>(
    async ({ email, password }) => {
      await AuthService.signIn(email, password)
    }
  )

  const onSubmit: SubmitHandler<SignInFormInputs> = data => {
    const checked = checkboxRef.current!.value
    const persistence = checked ? 'LOCAL' : 'SESSION'
    AuthService.setPersistence(persistence).then(() => {
      mutation.mutate(data)
    })
  }

  const isDisabled = mutation.isLoading || mutation.isSuccess

  return (
    <>
      <Typography variant='h5' mb={2}>
        Welcome back!
      </Typography>
      {mutation.isError && (
        <FormAlert message={mutation.error.message} onClose={mutation.reset} />
      )}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <TextField
          {...form.register('email', {
            required: 'An email is required',
          })}
          id='email'
          label='Email or username'
          fullWidth
          disabled={isDisabled}
          sx={{ mb: 3 }}
        />
        <TextField
          {...form.register('password', {
            required: 'A password is required',
          })}
          type='password'
          id='password'
          label='Password'
          fullWidth
          disabled={isDisabled}
          sx={{ mb: 1 }}
        />
        <FormControlLabel
          labelPlacement='start'
          control={
            <Checkbox
              inputRef={checkboxRef}
              inputProps={{ 'aria-label': 'Agreement' }}
              size='small'
            />
          }
          label={<Typography variant='caption'>Remember me?</Typography>}
          sx={{ ml: 0, mb: 1, justifyContent: 'space-between', width: '100%' }}
        />
        <Button type='submit' fullWidth loading={isDisabled}>
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
      <Box
        height='100%'
        display='flex'
        justifyContent='center'
        alignItems='center'
      >
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

const Root = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  overflow: 'hidden',
  background: 'linear-gradient(#de59a9, #fa6715)',
  position: 'relative',
  [theme.breakpoints.up('md')]: {
    height: '100vh',
  },
}))

const Typewriter = () => {
  const [text, setText] = React.useState<string[]>([])
  const charNumRef = React.useRef(0)
  const [fadeIn, setFadeIn] = React.useState(false)

  React.useEffect(() => {
    const allText = 'Discover eateries faster than ever...'
    const delta = 200 - Math.random() * 100

    const tick = () => {
      if (charNumRef.current < allText.length) {
        setText(prevText => [...prevText, allText[charNumRef.current]])
        ++charNumRef.current
        setTimeout(() => {
          tick()
        }, delta)
      } else {
        setFadeIn(true)
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
        {text.map((char, index) => (
          <span
            style={{
              borderRight:
                index === text.length - 1 ? '1px solid white' : 'none',
            }}
          >
            {char}
          </span>
        ))}
      </Typography>
      <Typography
        component='div'
        variant='body1'
        color='inherit'
        sx={{
          opacity: 0,
          ...(fadeIn && {
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

const Landing = () => {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to='/dashboard' replace />
  }

  const scrollToBottom = () => {
    const scrollEl = document.scrollingElement || document.body
    window.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' })
  }

  return (
    <Root>
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
      <Container sx={{ height: '100%' }}>
        <Grid container height={{ md: '100%' }}>
          <Grid
            item
            xs={12}
            md={6}
            container
            height={{ xs: '100vh', md: 'auto' }}
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
            height={{ xs: '100vh', md: 'auto' }}
          >
            <Box m='auto'>
              <FormPaper>
                <AuthForm />
              </FormPaper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Root>
  )
}

export default Landing
