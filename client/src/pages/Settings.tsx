import React from 'react'
import { AuthError, RecaptchaVerifier } from 'firebase/auth'
import { useOutletContext, Outlet, useLocation } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { UploadResult } from 'firebase/storage'
import { useMutation } from 'react-query'
import { useSnackbar, SnackbarKey } from 'notistack'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Theme } from '@mui/material/styles'
import styled from '@mui/material/styles/styled'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'
import { TextFieldProps } from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Hidden from '@mui/material/Hidden'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import AddIcon from '@mui/icons-material/AddCircle'
import ArrowDownIcon from '@mui/icons-material/ArrowDropDown'
import CheckIcon from '@mui/icons-material/Check'

import { ClientError } from '../types'
import { AuthService } from '../services/auth'
import { UsersService } from '../services/users'
import { useUser, IAuthContext } from '../context'
import { TextField, Button, Link, Avatar } from '../common/components'
import { LinkProps } from '../common/components/RouterLink'

type GeneralSettingsInputs = {
  name: string
  username: string
  about: string
}

type SettingsContext = {
  auth: Required<IAuthContext>
}

const SettingsTextField = React.forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => (
  <TextField
    ref={ref}
    fullWidth
    sx={{ mb: 4 }}
    InputLabelProps={{ shrink: true }}
    InputProps={{ sx: { backgroundColor: t => t.palette.background.paper } }}
    {...props}
  />
))

// const AboutMeTextField = React.forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => {
//   const [total, setTotal] = React.useState(0)

//   const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setTotal(e.target.value.length)
//   }

//   return (
//     <>
//       <Box>
//         <Typography variant='caption'>{1000 - total}</Typography>
//       </Box>
//       <SettingsTextField
//         ref={ref}
//         id='about'
//         label='About'
//         type='text'
//         inputProps={{ maxLength: 1000 }}
//         multiline
//         rows={3}
//         onChange={handleOnChange}
//         {...props}
//       />
//     </>
//   )
// })

export const GeneralSettings: React.FC = () => {
  const user = useUser()
  const form = useForm<GeneralSettingsInputs>()
  const [total, setTotal] = React.useState(0)

  const mutation = useMutation<void, ClientError<GeneralSettingsInputs>, GeneralSettingsInputs>(
    data => UsersService.updateUser(data),
    {
      onError: error => {
        if (error.details?.type === 'validation') {
          error.details.errors.forEach(({ field, message }) => {
            form.setError(field, { message })
          })
        }
      },
    }
  )

  const onSubmit: SubmitHandler<GeneralSettingsInputs> = data => {
    mutation.mutate(data)
  }

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTotal(e.target.value.length)
  }

  const { formState } = form

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Typography variant='body1' mb={3}>
        This information will be displayed on your profile page.
      </Typography>
      <SettingsTextField
        {...form.register('name', { required: 'A name is required' })}
        id='name'
        label='Name'
        defaultValue={user.name}
        error={!!formState.errors.name?.message}
        helperText={formState.errors.name?.message}
      />
      <SettingsTextField
        {...form.register('username', { required: 'A username is required' })}
        id='username'
        label='Username'
        defaultValue={user.username}
        error={!!formState.errors.username?.message}
        helperText={formState.errors.username?.message}
      />
      <Box position='relative'>
        <Typography variant='caption' position='absolute' top={-18} right={0}>
          {200 - total}
        </Typography>
        <SettingsTextField
          {...form.register('about', { onChange: handleAboutChange })}
          id='about'
          label='About'
          defaultValue={user.about}
          multiline
          rows={5}
          inputProps={{ style: { resize: 'vertical' } }}
          error={!!formState.errors.about?.message}
          helperText={formState.errors.about?.message}
        />
      </Box>
      <Button type='submit' loading={mutation.isLoading}>
        Save
      </Button>
    </form>
  )
}

type VerificationCodeInput = { verificationCode: string }

type VerificationCodeDialogProps = {
  auth: SettingsContext['auth']
  verificationId: string | null
  handleClose: () => void
}

const VerificationCodeDialog: React.FC<VerificationCodeDialogProps> = props => {
  const { auth, verificationId, handleClose } = props
  const form = useForm<VerificationCodeInput>()
  const { formState } = form

  const mutation = useMutation<void, AuthError, VerificationCodeInput>(
    ({ verificationCode }) => AuthService.updatePhoneNumber(verificationId!, verificationCode),
    {
      onSuccess() {
        auth.user.reload()
        handleClose()
      },
      onError(error) {
        console.log(error.code, error.message)
      },
    }
  )

  const onSubmit: SubmitHandler<VerificationCodeInput> = data => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={!!verificationId} onClose={handleClose}>
      <Paper>
        <Box p={5}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <SettingsTextField
              {...form.register('verificationCode', { required: true })}
              id='verification-code'
              label='Verification Code'
              sx={{ mb: 0, mr: 2 }}
              error={!!formState.errors.verificationCode}
              helperText={formState.errors.verificationCode?.message}
            />
            <Button type='submit' variant='contained' disabled={mutation.isLoading}>
              Submit
            </Button>
          </form>
        </Box>
      </Paper>
    </Dialog>
  )
}

type PersonalSettingsInputs = {
  email: string
  phoneNumber?: string
}

export const PersonalSettings = () => {
  const context = useOutletContext<SettingsContext>()
  const form = useForm<PersonalSettingsInputs>()
  const { formState } = form

  const recaptchaButtonRef = React.useRef<HTMLButtonElement>(null)
  const appVerifierRef = React.useRef<RecaptchaVerifier>()
  const [verificationId, setVerificationId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const button = recaptchaButtonRef.current!
    const appVerifier = AuthService.createRecaptchaVerifier(button)
    appVerifierRef.current = appVerifier
  }, [])

  const mutation = useMutation<void, AuthError, PersonalSettingsInputs>(
    async ({ email, phoneNumber }) => {
      await AuthService.updateEmail(email)
      if (phoneNumber && appVerifierRef.current) {
        const appVerifier = appVerifierRef.current
        const verificationId = await AuthService.verifyPhoneNumber(phoneNumber, appVerifier)
        setVerificationId(verificationId)
      } else {
        context.auth.user.reload()
      }
    },
    {
      onError(error) {
        console.log(error.code, error.message)
      },
    }
  )

  const onSubmit: SubmitHandler<PersonalSettingsInputs> = data => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setVerificationId(null)
  }

  return (
    <>
      <VerificationCodeDialog
        auth={context.auth}
        verificationId={verificationId}
        handleClose={handleClose}
      />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Typography variant='body1' mb={3}>
          This information will not be displayed. Save your phone number to receive text
          notifications.
        </Typography>
        <Stack>
          <SettingsTextField
            {...form.register('email', { required: 'An email is required' })}
            id='email'
            label='Email'
            defaultValue={context.auth.user!.email}
            error={!!formState.errors.email?.message}
            helperText={formState.errors.email?.message}
          />
          <SettingsTextField
            {...form.register('phoneNumber')}
            id='phone-number'
            label='Phone Number'
            defaultValue={context.auth.user!.phoneNumber}
            error={!!formState.errors.phoneNumber?.message}
            helperText={formState.errors.phoneNumber}
          />
        </Stack>
        <Button ref={recaptchaButtonRef} type='submit' loading={mutation.isLoading}>
          Save
        </Button>
      </form>
    </>
  )
}

type PasswordSettingsInputs = {
  password: string
  newPassword: string
}

export const PasswordSettings: React.FC = () => {
  const form = useForm<PasswordSettingsInputs>()
  const { formState } = form

  const mutation = useMutation<void, AuthError, PasswordSettingsInputs>(
    ({ newPassword }) => AuthService.updatePassword(newPassword),
    {
      onError(error) {
        console.log(error.code, error.message)
      },
    }
  )

  const onSubmit: SubmitHandler<PasswordSettingsInputs> = data => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Typography variant='body1' mb={3}>
        Change your password
      </Typography>
      <Stack>
        <SettingsTextField
          {...form.register('password', { required: 'A password is required' })}
          id='password'
          label='Password'
          error={!!formState.errors.password?.message}
          helperText={formState.errors.password?.message}
        />
        <SettingsTextField
          {...form.register('newPassword')}
          id='new-password'
          label='New Password'
          error={!!formState.errors.newPassword?.message}
          helperText={formState.errors.newPassword}
        />
      </Stack>
      <Button type='submit' loading={mutation.isLoading}>
        Save
      </Button>
    </form>
  )
}

const ProfilePhotoSettings: React.FC = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const user = useUser()

  const mutation = useMutation<UploadResult, FirebaseError, File, { snackbarKey: SnackbarKey }>(
    file => UsersService.setProfilePhoto(user.uid, file),
    {
      onMutate() {
        const snackbarKey = enqueueSnackbar('Updating profile picture...', {
          preventDuplicate: true,
          persist: true,
        })

        return { snackbarKey }
      },
      onSuccess(data, variables, context) {
        closeSnackbar(context?.snackbarKey)
        enqueueSnackbar('Profile picture updated!', {
          preventDuplicate: true,
          variant: 'success',
        })
      },
      onError(error, variables, context) {
        closeSnackbar(context?.snackbarKey)
        enqueueSnackbar('Failed to update profile picture!', {
          preventDuplicate: true,
          variant: 'error',
        })

        console.log(error.code, error.message)
      },
    }
  )

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const handleChangePhoto = () => fileInputRef.current?.click()
  const handleChangeFile: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { files } = e.target
    if (files) {
      const file = files[0]
      mutation.mutate(file)
    }
  }

  // TODO: Allow users to remove profile picture
  // const handleRemovePhoto: React.MouseEventHandler<HTMLButtonElement> = e => {
  //   usersService.deleteProfilePhoto(user.uid).catch(err => {
  //     console.log(err)
  //   })
  // }

  return (
    <Box display='flex' alignItems='center' mb={5}>
      <Stack direction='row' spacing={2}>
        <Badge
          overlap='circular'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Avatar
              size='small'
              sx={{
                border: t => `2px solid ${t.palette.background.paper}`,
                backgroundColor: t => t.palette.background.paper,
                color: t => t.palette.text.primary,
                cursor: 'pointer',
              }}
              onClick={handleChangePhoto}
            >
              <AddIcon />
            </Avatar>
          }
        >
          <Avatar
            alt='Your profile photo'
            src={user.photoURL}
            sx={{ width: 80, height: 80, cursor: 'pointer' }}
            onClick={handleChangePhoto}
          />
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            hidden
            onChange={handleChangeFile}
          />
        </Badge>
        <Stack>
          <Typography variant='h6' fontWeight={700}>
            {user.name} / General
          </Typography>
          <Typography variant='body2'>@{user.username}</Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

type MenuItemPropsLink = {
  to: string
  open: boolean
  isMdUp: boolean
  render: (props: { isPathMatch: boolean; to: string }) => JSX.Element
}

const ListItemLink: React.FC<MenuItemPropsLink> = props => {
  const { to, open, isMdUp, render } = props
  const { pathname } = useLocation()
  const isPathMatch = to === pathname

  return (
    <ListItem className={isPathMatch ? 'active' : ''} disablePadding>
      {render({ to, isPathMatch })}
      {isPathMatch && !isMdUp && (
        <ListItemIcon sx={{ position: 'absolute', right: 10, minWidth: 'auto', zIndex: -1 }}>
          {!open ? <ArrowDownIcon /> : <CheckIcon />}
        </ListItemIcon>
      )}
    </ListItem>
  )
}

const SettingsLink: React.FC<LinkProps> = props => <Link variant='body1' {...props} />

const SettingsMenu: React.FC<{ auth: Required<IAuthContext> }> = props => {
  const isMdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))
  const [open, setOpen] = React.useState(isMdUp)

  const toggleMenu = React.useCallback(
    (isPathMatch: boolean) => () => {
      if (!isMdUp) {
        if (isPathMatch) {
          setOpen(prevOpen => !prevOpen)
        } else {
          setOpen(false)
        }
      }
    },
    [isMdUp]
  )

  const deleteAccount = () => {
    props.auth.user.delete()
    setOpen(false)
  }

  return (
    <Stack className={open ? 'open' : ''} component={List} disablePadding mb={3}>
      <ListItemLink
        to='/settings/general'
        open={open}
        isMdUp={isMdUp}
        render={({ to, isPathMatch }) => (
          <SettingsLink to={to} onClick={toggleMenu(isPathMatch)}>
            General
          </SettingsLink>
        )}
      />
      <ListItemLink
        to='/settings/personal'
        open={open}
        isMdUp={isMdUp}
        render={({ to, isPathMatch }) => (
          <SettingsLink to={to} onClick={toggleMenu(isPathMatch)}>
            Personal
          </SettingsLink>
        )}
      />
      <ListItemLink
        to='/settings/password'
        open={open}
        isMdUp={isMdUp}
        render={({ to, isPathMatch }) => (
          <SettingsLink to={to} onClick={toggleMenu(isPathMatch)}>
            Password
          </SettingsLink>
        )}
      />
      <ListItemLink
        to='/settings/notifications'
        open={open}
        isMdUp={isMdUp}
        render={({ to, isPathMatch }) => (
          <SettingsLink to={to} onClick={toggleMenu(isPathMatch)}>
            Notifications
          </SettingsLink>
        )}
      />
      <Hidden mdDown>
        <Divider sx={{ my: 1 }} />
      </Hidden>
      <ListItemButton
        component='li'
        disableGutters
        onClick={deleteAccount}
        sx={theme => ({ color: theme.palette.error.main })}
      >
        Delete Account
      </ListItemButton>
    </Stack>
  )
}

const Root = styled(Container)(({ theme }) => ({
  '& ul li': {
    height: theme.spacing(4),
  },
  '& ul li:not(last-of-type) a, ul li:last-of-type': {
    fontSize: 16,
  },
  '& ul li.active a': {
    fontWeight: 800,
  },
  [theme.breakpoints.down('md')]: {
    // Menu closed
    '& ul': {
      border: `1px solid rgba(0, 0, 0, 0.23)`,
      borderRadius: 4,
      marginBottom: theme.spacing(5),
    },
    '& ul li': {
      height: 'auto',
      borderBottom: `1px solid rgba(0, 0, 0, 0.23)`,
    },
    '& ul li.active': {
      borderBottom: 'none',
    },
    '& ul li:not(.active)': {
      display: 'none',
    },
    '& ul li:not(last-of-type) a, ul li:last-of-type': {
      padding: theme.spacing(1.25),
    },

    // Menu open
    '& ul.open li:not(.active)': {
      display: 'flex',
    },
    '& ul.open li.active': {
      borderBottom: `1px solid rgba(0, 0, 0, 0.23)`,
    },
    '& ul.open li:last-of-type': {
      borderBottom: 'none',
    },
  },
}))

export const Settings: React.FC = () => {
  const { auth } = useOutletContext<{ auth: Required<IAuthContext> }>()
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const snackbarKey = React.useRef<SnackbarKey>()

  React.useEffect(() => {
    if (auth.claims?.accessLevel !== 1) {
      snackbarKey.current = enqueueSnackbar(
        'You must submit a name AND username in order to continue!',
        {
          preventDuplicate: true,
          variant: 'warning',
          persist: true,
        }
      )
    } else if (snackbarKey.current) {
      closeSnackbar(snackbarKey.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.claims?.accessLevel])

  return (
    <Root maxWidth='md' sx={{ pt: 5 }}>
      <Grid container>
        <Grid item xs={12} md={2}>
          <SettingsMenu auth={auth} />
        </Grid>
        <Grid item xs={12} md={10}>
          <Box ml={{ md: 5 }}>
            <ProfilePhotoSettings />
            <Outlet context={{ auth }} />
          </Box>
        </Grid>
      </Grid>
    </Root>
  )
}
