import React from 'react'
import debounce from 'lodash.debounce'
import { useQuery, useMutation } from 'react-query'
import { useForm, SubmitHandler } from 'react-hook-form'
import useTheme from '@mui/material/styles/useTheme'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import { UsersService } from '../services/users'
import { TextField, Button } from '../common/components'

type AccountSetupInputs = {
  name: string
  username: string
}

type State = {
  exists?: boolean
  helperText: React.ReactNode
}

const FinishAccountSetup = () => {
  const form = useForm<AccountSetupInputs>({
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const [state, setState] = React.useState<State>({
    helperText: 'Pick a username',
  })

  const debouncedCheckUsername = React.useCallback(
    debounce((username: string) => {
      UsersService.usernameExists(username)
        .then(exists => {
          const values = form.getValues()
          if (values.username) {
            setState({
              exists,
              helperText: exists ? 'Username is taken!' : 'Username available!',
            })
          }
        })
        .catch(error => {
          console.log('usernameExists error', error)
        })
    }, 200),
    []
  )

  const onUsernameChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setState({ helperText: 'Pick a username' })

      const username = e.target.value
      if (username) {
        debouncedCheckUsername(username)
      }
    },
    []
  )

  const mutation = useMutation<void, Error, AccountSetupInputs>(async data => {
    return UsersService.updateUser({
      name: data.name,
      username: data.username,
    })
  })

  const onSubmit: SubmitHandler<AccountSetupInputs> = data => {
    mutation.mutate(data)
  }

  const isDisabled = mutation.isLoading || mutation.isSuccess

  return (
    <Box m='auto' p={3}>
      <Paper sx={{ maxWidth: 350, p: 3 }}>
        <Typography variant='h6' mb={3}>
          Pick a name and username!
        </Typography>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            {...form.register('name', {
              required: 'A name is required',
            })}
            disabled={isDisabled}
            id='name'
            label='Name'
            fullWidth
            helperText='Enter your full name'
          />
          <TextField
            {...form.register('username', {
              required: 'A username is required',
              onChange: onUsernameChange,
            })}
            disabled={isDisabled}
            id='username'
            label='Username'
            fullWidth
            helperText={state.helperText}
            FormHelperTextProps={{
              sx: theme => ({
                ...(state.exists !== undefined && {
                  color: state.exists
                    ? theme.palette.error.main
                    : theme.palette.success.main,
                }),
              }),
            }}
          />
          <Button
            type='submit'
            fullWidth
            loading={isDisabled}
            disabled={
              !form.formState.isValid ||
              state.exists ||
              state.exists === undefined
            }
          >
            Submit
          </Button>
        </form>
      </Paper>
    </Box>
  )
}

export default FinishAccountSetup
