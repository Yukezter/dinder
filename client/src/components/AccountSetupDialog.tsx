import React from 'react'
import debounce from 'lodash.debounce'
import { useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { ClientError } from '../types'
import { UsersService } from '../services/users'
import { TextField, Button } from '../common/components'

type AccountSetupInputs = {
  name: string
  username: string
}

type State = {
  available?: boolean
  helperText?: React.ReactNode
}

const FinishAccountSetup = () => {
  const form = useForm<AccountSetupInputs>({
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const [state, setState] = React.useState<State>({
    helperText: 'Pick a username',
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedCheckUsername = React.useCallback(
    debounce((username: string) => {
      UsersService.usernameExists(username)
        .then(exists => {
          const currentValues = form.getValues()
          if (username === currentValues.username) {
            if (!exists) {
              setState({ available: true, helperText: 'Username available' })
            } else {
              setState({ available: false })
              form.setError('username', { message: 'Username unavailable' })
            }
          }
        })
        .catch(error => {
          setState({ available: false })
          form.setError('username', { message: 'Invalid username' })
          console.log(error?.code, error?.message)
        })
    }, 200),
    []
  )

  const onUsernameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const username = e.target.value
      if (username.length > 0) {
        setState({ helperText: 'Checking...' })
        debouncedCheckUsername(username)
      } else {
        setState({ helperText: 'Pick a username' })
      }
    },
    [debouncedCheckUsername]
  )

  const updateUser = useMutation<void, ClientError<AccountSetupInputs>, AccountSetupInputs>(
    async ({ name, username }) => UsersService.updateUser({ name, username }),
    {
      onError(error) {
        setState({ available: false })

        if (error.details?.type === 'validation') {
          error.details.errors.forEach(({ field, message }) => {
            form.setError(field, { message })
          })
        }

        console.log(error?.code, error?.message)
      },
    }
  )

  const onSubmit: SubmitHandler<AccountSetupInputs> = data => {
    updateUser.mutate(data)
  }

  const isDisabled = updateUser.isLoading || updateUser.isSuccess

  return (
    <Box m='auto' p={3}>
      <Paper sx={{ maxWidth: 350, p: 3 }}>
        <Typography variant='h6' mb={3}>
          Pick a name and username!
        </Typography>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            id='name'
            label='Name'
            fullWidth
            disabled={isDisabled}
            helperText={form.formState.errors.name?.message || 'Enter your full name'}
            error={!!form.formState.errors.name}
            {...form.register('name', { required: 'A name is required', max: 30 })}
          />
          <TextField
            id='username'
            label='Username'
            fullWidth
            disabled={isDisabled}
            helperText={form.formState.errors.username?.message || state.helperText}
            error={!!form.formState.errors.username}
            FormHelperTextProps={{
              sx: theme => ({
                ...(state.available !== undefined && {
                  color: state.available ? theme.palette.success.main : theme.palette.error.main,
                }),
              }),
            }}
            {...form.register('username', {
              required: 'A username is required',
              min: 3,
              max: 30,
              onChange: onUsernameChange,
            })}
          />
          <Button
            type='submit'
            fullWidth
            loading={isDisabled}
            disabled={!form.formState.isValid || state.available !== true}
          >
            Submit
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default FinishAccountSetup
