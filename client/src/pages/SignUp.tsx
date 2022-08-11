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

type SignUpFormInputs = {
  email: string
  password: string
}

export const SignUp = () => {
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
    <Box m='auto'>
      <FormPaper>
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <div style={{ display: 'inline-block' }}>
            <Typography variant='caption'>Already have an account?</Typography>{' '}
            <Link to='/login' variant='caption' color='primary' underline='hover' display='inline'>
              Sign in
            </Link>
          </div>
        </div>
      </FormPaper>
    </Box>
  )
}
