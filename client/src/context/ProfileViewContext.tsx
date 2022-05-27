import React from 'react'
import { useNavigate } from 'react-router-dom'
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
import CloseIcon from '@mui/icons-material/Close'
import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'
import SettingsIcon from '@mui/icons-material/Settings'

import { User, useUser } from './FirestoreContext'
import { useContactsMenu } from './ContactsMenuContext'
import { usePartySettings } from './PartySettingsContext'
import { useAddContact, useDeleteContact, useBlockContact } from '../hooks'
import { Avatar, Button } from '../common/components'

type ProfileProps = {
  userProfile: User
  handleClose: () => void
}

const Profile: React.FC<ProfileProps> = ({ userProfile, handleClose }) => {
  const user = useUser()
  const contactsMenu = useContactsMenu()
  const { openSettings } = usePartySettings()
  const addContact = useAddContact(userProfile)
  const deleteContact = useDeleteContact(userProfile)
  const blockContact = useBlockContact(userProfile)
  const isMutating = useIsMutating(['contacts', userProfile.uid]) > 0
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const isContact = React.useCallback(
    (id: string) => {
      const contacts =
        queryClient.getQueryData<(User | undefined)[]>('contacts') || []
      return contacts.some(contact => contact && contact.uid === id)
    },
    [queryClient]
  )

  return (
    <Box
      component={Paper}
      display='flex'
      flexDirection='column'
      alignItems='center'
      minWidth={300}
      maxWidth={400}
      p={5}
      position='relative'
    >
      <IconButton
        aria-label='close'
        onClick={handleClose}
        sx={{ position: 'absolute', right: 16, top: 16 }}
      >
        <CloseIcon />
      </IconButton>
      <Stack alignItems='center'>
        <div>
          <Typography variant='h5' align='center'>
            {userProfile?.name}
          </Typography>
          <Typography variant='h6' align='center'>
            @{userProfile?.username}
          </Typography>
        </div>
        <Avatar
          src={userProfile?.photoURL}
          sx={{ m: 2, width: 200, height: 200 }}
        />
      </Stack>
      {userProfile.about && (
        <>
          <Typography variant='body1' fontWeight={600} gutterBottom>
            About Me
          </Typography>
          <Typography variant='body2' paragraph>
            {userProfile.about}
          </Typography>
        </>
      )}
      {user.uid !== userProfile.uid ? (
        <>
          <Box display='flex' mb={1}>
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
              aria-label='delete-contact'
              onClick={() => blockContact.mutate(userProfile!)}
              disabled={isMutating}
            >
              <BlockIcon />
            </IconButton>
          </Box>
          {isContact(userProfile.uid) && (
            <Button
              size='small'
              disabled={isMutating}
              endIcon={<LocalDiningTwoToneIcon />}
              onClick={() => {
                handleClose()
                openSettings({
                  party: { members: [userProfile] },
                  onSuccess() {
                    contactsMenu.close()
                  },
                })
              }}
            >
              Start
            </Button>
          )}
        </>
      ) : (
        <Button
          size='small'
          endIcon={<SettingsIcon />}
          onClick={() => {
            handleClose()
            navigate('settings/general')
          }}
        >
          Edit
        </Button>
      )}
    </Box>
  )
}

interface IProfileViewContext {
  viewProfile: (userProfile?: User) => void
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

  const viewProfile = (userProfile?: User) => {
    if (userProfile) {
      setUserProfile(userProfile)
      setIsOpen(true)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Dialog open={isOpen && !!userProfile} onClose={handleClose}>
        <Profile userProfile={userProfile!} handleClose={handleClose} />
      </Dialog>
      <ProfileViewContext.Provider value={{ viewProfile }}>
        {props.children}
      </ProfileViewContext.Provider>
    </>
  )
}
