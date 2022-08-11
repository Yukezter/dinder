import { AuthErrorCodes } from 'firebase/auth'
import React from 'react'
import { AuthError } from 'firebase/auth'
import { useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import Box from '@mui/material/Box'

import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

import { AuthService } from '../services/auth'
import { getAuthErrorMessage } from '../errors'
import { Button, TextField, FormPaper, Link } from '../common/components'

type SignInFormInputs = {
  email: string
  password: string
}

export const SignIn = () => {
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
    <Box m='auto'>
      <FormPaper>
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <div style={{ display: 'inline-block' }}>
            <Typography variant='caption'>New to Dinder?</Typography>{' '}
            <Link to='/signup' variant='caption' color='primary' underline='hover' display='inline'>
              Create an account
            </Link>
          </div>
        </div>
      </FormPaper>
    </Box>
  )
}
