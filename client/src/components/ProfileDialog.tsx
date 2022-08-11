import React from 'react'
import debounce from 'lodash.debounce'
import { useNavigate } from 'react-router-dom'
import { UseQueryResult } from 'react-query'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline'
import BlockIcon from '@mui/icons-material/DoDisturb'
import UnblockIcon from '@mui/icons-material/LockOpen'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import EditIcon from '@mui/icons-material/Edit'
import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'
import CircularProgress from '@mui/material/CircularProgress'

import { User, Contacts } from '../types'
import { useUIContext, IUIContext, useUser } from '../context'
import { useGetContacts, useAddContact, useDeleteContact, useBlockUser } from '../hooks'
import { UserAvatar, Button, IconButton } from '../common/components'

type ContactsQueryResult = Omit<UseQueryResult<Contacts, unknown>, 'data'> & { data: Contacts }
type MutationType = 'add' | 'delete' | 'block' | 'unblock'
type ProfileProps = {
  ui: IUIContext
  contacts: ContactsQueryResult
}

const Profile: React.FC<ProfileProps> = props => {
  const { ui, contacts } = props
  const owner = ui.profile.owner as User
  const user = useUser()
  const addContact = useAddContact()
  const deleteContact = useDeleteContact()
  const blockContact = useBlockUser()
  const navigate = useNavigate()

  const hasUser = React.useCallback(
    (users: User[]) => {
      return users.some((contact: User) => {
        return contact.uid === owner.uid
      })
    },
    [owner.uid]
  )

  const cachedRelationship = React.useMemo(() => {
    if (hasUser(contacts.data.added)) {
      return 'added'
    }

    if (hasUser(contacts.data.blocked)) {
      return 'blocked'
    }

    return null
  }, [hasUser, contacts.data])

  const cachedRelationshipRef = React.useRef(cachedRelationship)
  cachedRelationshipRef.current = cachedRelationship

  const [optimisticRelationship, setOptimisticRelationship] = React.useState(cachedRelationship)
  const optimisticRelationshipRef = React.useRef(optimisticRelationship)
  optimisticRelationshipRef.current = optimisticRelationship

  const isDebouncingRef = React.useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedMutate = React.useCallback(
    debounce((type: MutationType) => {
      isDebouncingRef.current = false

      if (optimisticRelationshipRef.current === cachedRelationshipRef.current) {
        return
      }

      if (type === 'add') {
        console.log('adding contact...')
        addContact.mutate(owner)
      } else if (type === 'delete') {
        console.log('deleting contact...')
        deleteContact.mutate(owner)
      } else if (type === 'block') {
        console.log('blocking contact...')
        blockContact.mutate(owner)
      } else if (type === 'unblock') {
        console.log('unblocking contact...')
      }
    }, 3000),
    []
  )

  React.useEffect(() => {
    if (!isDebouncingRef.current) {
      setOptimisticRelationship(cachedRelationship)
    }

    return () => {
      debouncedMutate.flush()
    }
  }, [debouncedMutate, cachedRelationship])

  const mutate = React.useCallback(
    (type: MutationType) => {
      const newType = type === 'add' ? 'added' : type === 'block' ? 'blocked' : null
      setOptimisticRelationship(newType)

      isDebouncingRef.current = true
      debouncedMutate(type)
    },
    [debouncedMutate]
  )

  const handleStartParty = () => {
    ui.profile.close()
    ui.party.open({ members: [owner] })
  }

  const handleEdit = () => {
    ui.profile.close()
    navigate('settings/general')
  }

  const isAdded = optimisticRelationship === 'added'
  const isBlocked = optimisticRelationship === 'blocked'

  return (
    <>
      <Stack width='100%' mb={owner.about ? 2 : 3}>
        <Box display='flex' justifyContent='space-between' mb={1}>
          <IconButton aria-label='close' onClick={ui.profile.close}>
            <ArrowBackIcon />
          </IconButton>
          {user.uid === owner.uid && (
            <IconButton aria-label='close' onClick={handleEdit}>
              <EditIcon />
            </IconButton>
          )}
        </Box>
        <Box mx='auto' mb={3}>
          <UserAvatar
            isLoading={contacts.isLoading}
            src={owner.photoURL}
            id={owner.uid}
            sx={{ width: 120, height: 120 }}
          />
        </Box>
        <Typography variant='h5' align='center' fontWeight={700}>
          {owner.name}
        </Typography>
        <Typography variant='body2' align='center'>
          @{owner.username}
        </Typography>
      </Stack>
      {owner.about && (
        <Typography variant='body2' align='center' mb={3}>
          {owner.about}
        </Typography>
      )}
      {user.uid !== owner.uid ? (
        <>
          <Box width='100%' maxWidth={160} display='flex' justifyContent='space-between' mt='auto'>
            <IconButton
              aria-label='start-party'
              color='primary'
              onClick={handleStartParty}
              disabled={isBlocked}
            >
              <LocalDiningTwoToneIcon />
            </IconButton>
            <IconButton
              aria-label={isAdded ? 'delete-contact' : 'add-contact'}
              color='primary'
              onClick={() => mutate(isAdded ? 'delete' : 'add')}
              disabled={contacts.isLoading}
            >
              {isAdded ? <RemoveIcon /> : <AddIcon />}
            </IconButton>
            <IconButton
              aria-label={isBlocked ? 'unblock-contact' : 'block-contact'}
              color={isBlocked ? 'success' : 'error'}
              onClick={() => mutate(isBlocked ? 'unblock' : 'block')}
              disabled={contacts.isLoading}
            >
              {isBlocked ? <UnblockIcon /> : <BlockIcon />}
            </IconButton>
          </Box>
        </>
      ) : (
        <Button
          aria-label='start-party'
          variant='outlined'
          endIcon={<EditIcon />}
          fullWidth
          sx={{ mt: 'auto' }}
          onClick={handleEdit}
        >
          Edit
        </Button>
      )}
    </>
  )
}

type ProfileDialogProps = {}

export const ProfileDialog: React.FC<ProfileDialogProps> = props => {
  const ui = useUIContext()
  const contacts = useGetContacts()

  return (
    <Dialog
      open={ui.profile.isOpen && !!ui.profile.owner}
      onClose={ui.profile.close}
      PaperProps={{
        sx: {
          ...(contacts.isLoading && {
            backgroundColor: 'transparent',
          }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 420,
          width: '100%',
          maxWidth: 340,
          px: 4,
          py: 5,
        },
      }}
    >
      {contacts.isLoading ? (
        <CircularProgress sx={{ m: 'auto' }} />
      ) : (
        <Profile ui={ui} contacts={contacts as ContactsQueryResult} />
      )}
    </Dialog>
  )
}

export default ProfileDialog
