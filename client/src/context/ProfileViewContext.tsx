import React from 'react'
import { useQueryClient, useIsMutating } from 'react-query'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline'
import BlockIcon from '@mui/icons-material/DoDisturb'

import { usersService } from '../services'
import { User } from './FirestoreContext'
import { useAddContact, useDeleteContact, useBlockContact } from '../hooks'
import { Avatar } from '../common/components'

type ProfileProps = {
  userProfile: User
}

const Profile: React.FC<ProfileProps> = ({ userProfile }) => {
  const queryClient = useQueryClient()
  const addContact = useAddContact(userProfile)
  const deleteContact = useDeleteContact(userProfile)
  const blockContact = useBlockContact(userProfile)
  const isMutating = useIsMutating(['contacts', userProfile.uid]) > 0

  const isContact = React.useCallback(
    (id: string) => {
      const contacts =
        queryClient.getQueryData<(User | undefined)[]>('contacts') || []
      return contacts.some(contact => contact && contact.uid === id)
    },
    [isMutating]
  )

  return (
    <Box
      component={Paper}
      display='flex'
      flexDirection='column'
      alignItems='center'
      maxWidth={400}
      p={5}
    >
      <Stack alignItems='center'>
        <div>
          <Typography variant='h5' align='center'>
            {userProfile?.name}
          </Typography>
          <Typography variant='h6' align='center'>
            {userProfile?.username}
          </Typography>
        </div>
        <Avatar
          id={userProfile?.uid}
          src={userProfile?.photoURL}
          sx={{ m: 2, width: 120, height: 120 }}
        />
      </Stack>
      <Typography variant='body1' fontWeight={600} paragraph>
        About me
      </Typography>
      <Typography variant='body2' align='center' paragraph>
        {userProfile?.about}
      </Typography>
      <Box display='flex'>
        {isContact(userProfile.uid) ? (
          <IconButton
            aria-label='delete-contact'
            onClick={() => deleteContact.mutate(userProfile!)}
            disabled={isMutating}
          >
            <RemoveIcon />
          </IconButton>
        ) : (
          <IconButton
            aria-label='add-contact'
            onClick={() => addContact.mutate(userProfile!)}
            disabled={isMutating}
          >
            <AddIcon />
          </IconButton>
        )}
        <IconButton
          aria-label='delete'
          onClick={() => blockContact.mutate(userProfile!)}
          disabled={isMutating}
        >
          <BlockIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

interface IProfileViewContext {
  viewProfile: (userProfile: User) => void
}

const ProfileViewContext = React.createContext<IProfileViewContext>(
  {} as IProfileViewContext
)

export const useProfile = () => React.useContext(ProfileViewContext)

type ProfileViewProviderProps = {}

export const ProfileViewProvider: React.FC<
  ProfileViewProviderProps
> = props => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [userProfile, setUserProfile] = React.useState<User>()

  const viewProfile = (userProfile: User) => {
    setUserProfile(userProfile)
    setIsOpen(true)
  }

  return (
    <>
      <Dialog
        open={isOpen && !!userProfile}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflowY: 'initial',
          },
        }}
      >
        <Profile userProfile={userProfile!} />
      </Dialog>
      <ProfileViewContext.Provider value={{ viewProfile }}>
        {props.children}
      </ProfileViewContext.Provider>
    </>
  )
}
