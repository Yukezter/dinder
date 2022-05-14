import React from 'react'
import {
  useOutletContext,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { RecaptchaVerifier } from 'firebase/auth'
import { UploadResult } from 'firebase/storage'
import { useMutation } from 'react-query'
import { useSnackbar, SnackbarKey } from 'notistack'
import { useForm, SubmitHandler } from 'react-hook-form'
import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Hidden from '@mui/material/Hidden'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import Badge from '@mui/material/Badge'
import AddIcon from '@mui/icons-material/AddCircle'
import ArrowDownIcon from '@mui/icons-material/ArrowDropDown'
import CheckIcon from '@mui/icons-material/Check'

import { AuthService } from '../../services/auth'
import { UsersService } from '../../services/users'
import { IAuthContext } from '../../context/AuthContext'
import { useUser } from '../../context/FirestoreContext'
import { TextField, Button, Link, Avatar } from '../../common/components'

type ValidationError<T> = {
  message: string
  fieldValue: string
  field: keyof T
}

type GeneralSettingsInputs = {
  name: string
  username: string
  about: string
}

type SettingsContext = {
  auth: Required<IAuthContext>
  cancelSettings: () => void
}

export const GeneralSettings: React.FC = () => {
  const user = useUser()
  const context = useOutletContext<SettingsContext>()

  const form = useForm<GeneralSettingsInputs>()
  const { formState } = form

  const mutation = useMutation<void, any, GeneralSettingsInputs>(async data => {
    return UsersService.updateUser(data)
  })

  const onSubmit: SubmitHandler<GeneralSettingsInputs> = data => {
    mutation.mutate(data, {
      onError: error => {
        if (error.details) {
          const details: ValidationError<GeneralSettingsInputs>[] =
            error.details
          details.forEach(detail => {
            form.setError(detail.field, {
              message: detail.message,
            })
          })
        }
      },
    })
  }

  React.useEffect(() => {
    if (!user.name) {
      form.setError('name', {
        type: 'required',
        message: 'A name is required',
      })
    }

    if (!user.username) {
      form.setError('username', {
        type: 'required',
        message: 'A username is required',
      })
    }
  }, [user, mutation.error])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Typography variant='body1' mb={3}>
        This information will be displayed on your profile page.
      </Typography>
      <Stack maxWidth={300}>
        <TextField
          {...form.register('name', {
            required: 'A name is required',
          })}
          id='name'
          label='Name'
          sx={{ mb: 4 }}
          defaultValue={user.name}
          error={!!formState.errors.name?.message}
          helperText={formState.errors.name?.message}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { backgroundColor: t => t.palette.background.paper },
          }}
        />
        <TextField
          {...form.register('username', {
            required: 'A username is required',
          })}
          id='username'
          label='Username'
          sx={{ mb: 4 }}
          defaultValue={user.username}
          error={!!formState.errors.username?.message}
          helperText={formState.errors.username?.message}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { backgroundColor: t => t.palette.background.paper },
          }}
        />
      </Stack>
      <TextField
        {...form.register('about')}
        id='about'
        label='About'
        fullWidth
        sx={{ mb: 4 }}
        multiline
        rows={3}
        defaultValue={user.about}
        error={!!formState.errors.about?.message}
        helperText={formState.errors.about?.message}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          sx: { backgroundColor: t => t.palette.background.paper },
        }}
      />
      <Box display='flex' justifyContent='flex-end'>
        <Button type='submit' loading={mutation.isLoading} sx={{ mr: 1 }}>
          Save
        </Button>
        <Button
          variant='outlined'
          disabled={mutation.isLoading}
          onClick={context.cancelSettings}
        >
          Cancel
        </Button>
      </Box>
    </form>
  )
}

type VerificationCodeInput = { verificationCode: string }

type VerificationCodeDialogProps = {
  auth: SettingsContext['auth']
  verificationId?: string
  setVerificationId: React.Dispatch<React.SetStateAction<string | undefined>>
}

const VerificationCodeDialog: React.FC<VerificationCodeDialogProps> = props => {
  const { auth, verificationId, setVerificationId } = props

  const form = useForm<VerificationCodeInput>()

  const handleClose = () => {
    setVerificationId(undefined)
  }

  const mutation = useMutation<void, any, VerificationCodeInput>(
    async ({ verificationCode }) => {
      console.log('verificationCode', verificationCode)
      await AuthService.updatePhoneNumber(verificationId!, verificationCode)
      auth.user!.reload()
      handleClose()
    }
  )

  const onSubmit: SubmitHandler<VerificationCodeInput> = data => {
    mutation.mutate(data, {
      onError: error => {
        console.log(error)
      },
    })
  }

  return (
    <Dialog open={!!verificationId} onClose={handleClose}>
      <Paper>
        <Box p={5}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TextField
              {...form.register('verificationCode', {
                required: true,
              })}
              id='verification-code'
              label='Verification Code'
              sx={{ mb: 0, mr: 2 }}
              error={!!form.formState.errors.verificationCode?.message}
              helperText={form.formState.errors.verificationCode}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                sx: { backgroundColor: t => t.palette.background.paper },
              }}
            />
            <Button
              type='submit'
              variant='contained'
              disabled={mutation.isLoading}
            >
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

  const recaptchaButtonRef = React.useRef<HTMLButtonElement>(null)
  const appVerifierRef = React.useRef<RecaptchaVerifier>()
  const [verificationId, setVerificationId] = React.useState<string>()

  React.useEffect(() => {
    const button = recaptchaButtonRef.current!
    const appVerifier = AuthService.createRecaptchaVerifier(button)
    appVerifierRef.current = appVerifier
  }, [])

  const mutation = useMutation<void, any, PersonalSettingsInputs>(
    async ({ email, phoneNumber }) => {
      await AuthService.updateEmail(email)
      if (phoneNumber) {
        const appVerifier = appVerifierRef.current!
        const verificationId = await AuthService.verifyPhoneNumber(
          phoneNumber,
          appVerifier
        )
        setVerificationId(verificationId)
      } else {
        context.auth.user?.reload()
      }
    }
  )

  const onSubmit: SubmitHandler<PersonalSettingsInputs> = data => {
    mutation.mutate(data, {
      onError: error => {
        console.log(error)
      },
    })
  }

  React.useEffect(() => {
    if (!context.auth.user?.email) {
      form.setError('email', {
        type: 'required',
        message: 'An email is required',
      })
    }
  }, [context.auth.user, mutation.error])

  return (
    <>
      <VerificationCodeDialog
        auth={context.auth}
        verificationId={verificationId}
        setVerificationId={setVerificationId}
      />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Typography variant='body1' mb={3}>
          This information will not be displayed. Save your phone number to
          receive text notifications.
        </Typography>
        <Stack maxWidth={300}>
          <TextField
            {...form.register('email', {
              required: 'An email is required',
            })}
            id='email'
            label='Email'
            sx={{ mb: 4 }}
            defaultValue={context.auth.user!.email}
            error={!!form.formState.errors.email?.message}
            helperText={form.formState.errors.email?.message}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { backgroundColor: t => t.palette.background.paper },
            }}
          />
          <TextField
            {...form.register('phoneNumber')}
            id='phone-number'
            label='Phone Number'
            sx={{ mb: 4 }}
            defaultValue={context.auth.user!.phoneNumber}
            error={!!form.formState.errors.phoneNumber?.message}
            helperText={form.formState.errors.phoneNumber}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { backgroundColor: t => t.palette.background.paper },
            }}
          />
        </Stack>
        <Box display='flex' justifyContent='flex-end'>
          <Button type='submit' loading={mutation.isLoading} sx={{ mr: 1 }}>
            Save
          </Button>
          <Button
            ref={recaptchaButtonRef}
            variant='outlined'
            disabled={mutation.isLoading}
            onClick={context.cancelSettings}
          >
            Cancel
          </Button>
        </Box>
      </form>
    </>
  )
}

type PasswordSettingsInputs = {
  password: string
  newPassword: string
}

export const PasswordSettings: React.FC = () => {
  const context = useOutletContext<SettingsContext>()

  const form = useForm<PasswordSettingsInputs>()
  const { formState } = form

  const mutation = useMutation<void, any, PasswordSettingsInputs>(
    async data => {
      return AuthService.updatePassword(data.newPassword)
    }
  )

  const onSubmit: SubmitHandler<PasswordSettingsInputs> = data => {
    mutation.mutate(data, {
      onError: error => {
        console.log(error)
      },
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Typography variant='body1' mb={3}>
        Change your password
      </Typography>
      <Stack maxWidth={300}>
        <TextField
          {...form.register('password', {
            required: 'A password is required',
          })}
          id='password'
          label='Password'
          sx={{ mb: 4 }}
          error={!!formState.errors.password?.message}
          helperText={formState.errors.password?.message}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { backgroundColor: t => t.palette.background.paper },
          }}
        />
        <TextField
          {...form.register('newPassword')}
          id='new-password'
          label='New Password'
          sx={{ mb: 4 }}
          error={!!formState.errors.newPassword?.message}
          helperText={formState.errors.newPassword}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            sx: { backgroundColor: t => t.palette.background.paper },
          }}
        />
      </Stack>
      <Box display='flex' justifyContent='flex-end'>
        <Button type='submit' loading={mutation.isLoading} sx={{ mr: 1 }}>
          Save
        </Button>
        <Button
          variant='outlined'
          disabled={mutation.isLoading}
          onClick={context.cancelSettings}
        >
          Cancel
        </Button>
      </Box>
    </form>
  )
}

const ProfilePhotoSettings: React.FC = () => {
  const user = useUser()

  const mutation = useMutation<UploadResult, FirebaseError, File>(
    async file => {
      const userId = user.uid
      return UsersService.setProfilePhoto(userId, file)
    }
  )

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const changePhoto = () => fileInputRef.current?.click()

  const handleChangePhoto: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { files } = e.target
    if (files) {
      const file = files[0]
      mutation.mutate(file)
    }
  }

  // const handleRemovePhoto: React.MouseEventHandler<HTMLButtonElement> = e => {
  //   usersService.deleteProfilePhoto(user.uid).catch(err => {
  //     console.log(err)
  //   })
  // }

  return (
    <Box display='flex' alignItems='center' mb={4}>
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
              onClick={changePhoto}
              // imgProps={{ onClick: changePhoto }}
            >
              <AddIcon />
            </Avatar>
          }
        >
          <Avatar
            alt='Your profile photo'
            src={user.photoURL}
            sx={{ width: 80, height: 80, cursor: 'pointer' }}
            onClick={changePhoto}
            // imgProps={{ onClick: changePhoto }}
          />
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            hidden
            onChange={handleChangePhoto}
          />
        </Badge>
        <Stack>
          <Typography variant='h6' fontWeight={700}>
            General
          </Typography>
          <Typography variant='body2'>{user.username}</Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

const Root = styled('div')(({ theme }) => ({
  paddingBottom: 80,
  '& ul li': {
    height: theme.spacing(3),
  },
  '& ul li a, ul li button': {
    fontSize: theme.typography.body1.fontSize,
  },
  '& ul li.active a': {
    fontWeight: 700,
  },
  [theme.breakpoints.down('sm')]: {
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
    '& ul li a, ul li button': {
      padding: theme.spacing(1.25),
    },

    // open
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

type SettingsMenuItemProps = {
  to: string
  pathname: string
  label?: string
  isDesktop: boolean
  open: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = props => {
  const { to, pathname, label, isDesktop, open, setOpen } = props
  const pathMatch = to === pathname

  const toggleMenu = () => {
    if (setOpen && !isDesktop) {
      if (pathMatch) {
        setOpen(prev => !prev)
        return false
      } else {
        setOpen(false)
      }
    }
  }

  return (
    <ListItem className={pathMatch ? 'active' : ''} disablePadding>
      {!props.children ? (
        <Link to={to} variant='body2' onClick={toggleMenu} width='100%'>
          {label}
        </Link>
      ) : (
        props.children
      )}
      {pathMatch && !isDesktop && (
        <ListItemIcon
          sx={{ position: 'absolute', right: 10, minWidth: 'auto', zIndex: -1 }}
        >
          {!open ? <ArrowDownIcon /> : <CheckIcon />}
        </ListItemIcon>
      )}
    </ListItem>
  )
}

const SettingsMenu: React.FC<{ auth: Required<IAuthContext> }> = props => {
  const { pathname } = useLocation()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'))
  const [open, setOpen] = React.useState(isDesktop)

  const deleteAccount = () => {
    props.auth.user.delete()
  }

  return (
    <Stack
      dense
      className={open ? 'open' : ''}
      component={List}
      disablePadding
      // maxWidth={150}
      marginBottom={3}
    >
      <SettingsMenuItem
        to='/settings/general'
        pathname={pathname}
        isDesktop={isDesktop}
        open={open}
        setOpen={setOpen}
        label='General'
      />
      <SettingsMenuItem
        to='/settings/personal'
        pathname={pathname}
        isDesktop={isDesktop}
        open={open}
        setOpen={setOpen}
        label='Personal'
      />
      <SettingsMenuItem
        to='/settings/password'
        pathname={pathname}
        isDesktop={isDesktop}
        open={open}
        setOpen={setOpen}
        label='Password'
      />
      <SettingsMenuItem
        to='/settings/notifications'
        pathname={pathname}
        isDesktop={isDesktop}
        open={open}
        setOpen={setOpen}
        label='Notifications'
      />
      <Hidden smDown>
        <Divider sx={{ my: 1 }} />
      </Hidden>
      <SettingsMenuItem
        to='/settings/dashboard'
        pathname={pathname}
        isDesktop={isDesktop}
        open={open}
      >
        <ButtonBase
          tabIndex={0}
          onClick={deleteAccount}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            color: t => t.palette.error.main,
            '&.Mui-focusVisible': {
              outline: 'auto 1px',
            },
          }}
        >
          Delete Account
        </ButtonBase>
      </SettingsMenuItem>
    </Stack>
  )
}

const Settings: React.FC = () => {
  const { auth } = useOutletContext<{ auth: Required<IAuthContext> }>()
  const navigate = useNavigate()
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
  }, [auth.claims?.accessLevel])

  const cancelSettings = () => {
    navigate('/dashboard')
  }

  return (
    <Root>
      <Grid container columnSpacing={{ xs: 4, sm: 8 }}>
        <Grid item xs={12}>
          <ProfilePhotoSettings />
        </Grid>
        <Grid item xs={12} sm='auto'>
          <SettingsMenu auth={auth} />
        </Grid>
        <Grid item xs={12} sm>
          <Paper
            sx={{
              p: 4,
              // backgroundColor: t => t.palette.grey[100],
            }}
          >
            <Outlet context={{ auth, cancelSettings }} />
          </Paper>
        </Grid>
      </Grid>
    </Root>
  )
}

export default Settings
