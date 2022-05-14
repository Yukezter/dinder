import React from 'react'
import { Navigate } from 'react-router-dom'
import { useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

import { AuthService } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import landingImage from '../assets/images/food.jpg'
import backgroundImage from '../assets/images/background.svg'
import { Button, FormAlert, TextField, FormPaper } from '../common/components'

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

const RootGrid = styled(Grid)(({ theme }) => ({
  height: '100vh',
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'right',
  '& > div': {
    height: '100vh',
  },
}))

const LandingImg = styled('img')(({ theme }) => ({
  height: '100%',
  width: '100%',
  objectFit: 'cover',
  position: 'relative',
  '::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
  },
}))

const Landing = () => {
  const auth = useAuth()

  if (auth.user && auth.claims?.accessLevel !== undefined) {
    return <Navigate to='/dashboard' replace />
  }

  return (
    <Box minHeight='100vh' display='flex' overflow='hidden'>
      <RootGrid container>
        <Grid item xs md={5}>
          <LandingImg src={landingImage} alt='' />
        </Grid>
        <Grid item xs={12} md={7} container>
          <Box m='auto'>
            <FormPaper>
              <AuthForm />
            </FormPaper>
          </Box>
        </Grid>
      </RootGrid>
    </Box>
  )
}

export default Landing

// if (postfix.length > 3) {
//   let newPostfix = ''
//   postfix
//     .split('')
//     .filter(char => char !== '-')
//     .forEach((number, index) => {
//       if (index !== 0 && index % 3 === 0) {
//         newPostfix += '-'
//       }

//       newPostfix += number
//     })
//   postfix = newPostfix
// }

// const prefix = '+1'
// let { value } = e.target
//     if (value) {
//       let postfix = value.startsWith(prefix.substring(0, value.length))
//         ? value.substring(prefix.length)
//         : value

//       setPhoneNumber(postfix.length ? `${prefix}${postfix}` : '')
//     }
