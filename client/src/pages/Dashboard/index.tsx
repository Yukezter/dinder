import React from 'react'
import { FirestoreError } from 'firebase/firestore'
import { To, useNavigate } from 'react-router-dom'
import {
  useQuery,
  useMutation,
  useIsMutating,
  useQueryClient,
} from 'react-query'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import GlobalStyles from '@mui/material/GlobalStyles'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Popper, { PopperProps } from '@mui/material/Popper'
import Skeleton from '@mui/material/Skeleton'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Hidden from '@mui/material/Hidden'
import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import SettingsIcon from '@mui/icons-material/Settings'
import NotificationsIcon from '@mui/icons-material/Notifications'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SignOutIcon from '@mui/icons-material/Logout'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Badge from '@mui/material/Badge'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import SadFaceIcon from '@mui/icons-material/SentimentDissatisfied'
import MenuDotsIcon from '@mui/icons-material/MoreVert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useUser, User } from '../../context/FirestoreContext'
import { useProfile } from '../../context/ProfileViewContext'
import { authService, usersService } from '../../services'
import {
  useSearch,
  usePopper,
  useGetContacts,
  useDeleteContact,
  useBlockContact,
} from '../../hooks'
import { AutocompleteState, Autocomplete } from '../../hooks/useSearch'
import { Header } from '../../components'
import {
  IconButton,
  BrandName,
  TextField,
  Button,
  Avatar,
} from '../../common/components'

const searchInputHeight = 40

const SearchInput: React.FC<{ autocomplete: Autocomplete }> = props => {
  const { autocomplete } = props
  return (
    <Box mb={3}>
      <TextField
        id='search'
        fullWidth
        hiddenLabel
        InputLabelProps={{
          shrink: false,
          ...autocomplete.getLabelProps(),
        }}
        InputProps={{
          className: 'aa-Input',
          ...autocomplete.getInputProps({
            inputElement: null,
          }),
          type: 'text',
          sx: {
            '&.MuiOutlinedInput-root': {
              height: searchInputHeight,
              borderRadius: 16,
            },
            '& fieldset': {
              borderColor: 'action.disabled',
            },
          },
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 0,
          mr: 'auto',
          '& fieldset': {
            borderColor: 'transparent',
          },
        }}
      />
    </Box>
  )
}

const SearchResults: React.FC<{
  autocomplete: Autocomplete
  autocompleteState: AutocompleteState
}> = ({ autocomplete, autocompleteState }) => {
  return (
    <Box className='aa-Panel' {...autocomplete.getPanelProps({})}>
      {autocompleteState && autocompleteState.isOpen && (
        <>
          {autocompleteState.status === 'stalled' ? (
            <CircularProgress />
          ) : (
            autocompleteState!.collections.map(({ source, items }, index) => {
              return (
                <div key={`source-${index}`} className='aa-Source'>
                  {source.sourceId === 'recent' && items.length > 0 && (
                    <Typography variant='body2' px={1} fontWeight={600}>
                      RECENT
                    </Typography>
                  )}
                  {source.sourceId === 'users' && (
                    <Typography variant='body2' px={1} fontWeight={600}>
                      SEARCH RESULTS
                    </Typography>
                  )}
                  <List className='aa-List' {...autocomplete.getListProps()}>
                    {items.length > 0
                      ? items.map(item => (
                          <ListItem
                            key={item.objectID}
                            className='aa-Item'
                            disableGutters
                            sx={{
                              '&[aria-selected="true"]': {
                                backgroundColor: 'action.hover',
                                '& [tabindex="0"]': {
                                  backgroundColor: 'transparent',
                                },
                              },
                            }}
                            secondaryAction={
                              source.sourceId === 'recent' ? (
                                <IconButton
                                  aria-label='delete'
                                  {...autocomplete.getRemoveRecentItemProps(
                                    item
                                  )}
                                >
                                  <CloseIcon />
                                </IconButton>
                              ) : undefined
                            }
                            {...autocomplete.getItemProps({
                              item,
                              source,
                            })}
                          >
                            <ListItemButton
                              role={undefined}
                              dense
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar alt={item.name} src={item.photoURL} />
                              </ListItemAvatar>
                              <ListItemText
                                primary={item._highlightedParts.name.map(
                                  part => {
                                    if (!part.isHighlighted) return part.value
                                    return (
                                      <strong key={part.value}>
                                        {part.value}
                                      </strong>
                                    )
                                  }
                                )}
                                secondary={item._highlightedParts.username.map(
                                  part => {
                                    if (!part.isHighlighted) return part.value
                                    return (
                                      <strong key={part.value}>
                                        {part.value}
                                      </strong>
                                    )
                                  }
                                )}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                      : !!autocompleteState.query &&
                        autocompleteState.status === 'idle' &&
                        source.sourceId === 'users' && (
                          <ListItem component='div'>
                            <ListItemAvatar>
                              <Avatar>
                                <SadFaceIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText>No Users Found</ListItemText>
                          </ListItem>
                        )}
                  </List>
                </div>
              )
            })
          )}
        </>
      )}
    </Box>
  )
}

type ContactPopperProps = {
  deleteContact: () => void
  blockContact: () => void
  locked: boolean
}

const ContactPopper: React.FC<ContactPopperProps> = ({
  deleteContact,
  locked,
}) => {
  const popper = usePopper<HTMLButtonElement>()

  const handleDeleteContact = () => {
    popper.handlePopperClose()
    deleteContact()
  }

  const handleBlockContact = () => {
    popper.handlePopperClose()
    deleteContact()
  }

  return (
    <>
      <IconButton
        id='manage-contact-button'
        aria-controls={popper.open ? 'account-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={popper.open ? 'true' : undefined}
        onClick={popper.handlePopperToggle}
      >
        <MenuDotsIcon />
      </IconButton>
      <Popper {...popper.getPopperProps()} placement='bottom'>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            <MenuItem dense onClick={handleDeleteContact} disabled={locked}>
              Remove
            </MenuItem>
            <MenuItem
              dense
              sx={{ color: t => t.palette.error.main }}
              onClick={handleBlockContact}
              disabled={locked}
            >
              Block
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

type ContactProps = {
  contact?: User
  isLoading: boolean
}

const Contact: React.FC<ContactProps> = props => {
  const { contact, isLoading } = props
  const deleteContact = useDeleteContact(contact)
  const blockContact = useBlockContact(contact)
  const isMutating = useIsMutating(['contacts', contact?.uid]) > 0
  const { viewProfile } = useProfile()

  return (
    <ListItem
      disableGutters
      secondaryAction={
        contact &&
        !isLoading && (
          <ContactPopper
            deleteContact={() => deleteContact.mutate(contact)}
            blockContact={() => blockContact.mutate(contact)}
            locked={isMutating}
          />
        )
      }
    >
      <ListItemButton
        role={undefined}
        onClick={() => viewProfile(contact!)}
        dense
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        disabled={isLoading}
      >
        <ListItemAvatar>
          <Avatar
            isLoading={isLoading}
            id={contact?.uid}
            alt={contact?.name}
            src={contact?.photoURL}
          />
        </ListItemAvatar>
        <ListItemText
          primary={isLoading ? <Skeleton width='80%' /> : contact?.name}
          secondary={isLoading ? <Skeleton width='50%' /> : contact?.username}
        />
      </ListItemButton>
    </ListItem>
  )
}

const ContactsMenu: React.FC = props => {
  const { autocomplete, autocompleteState } = useSearch()
  const { data, isPlaceholderData } = useGetContacts({
    placeholderData: Array.from(Array(5)).fill(undefined),
  })

  return (
    <>
      <Box className='aa-Autocomplete' {...autocomplete.getRootProps({})}>
        <SearchInput autocomplete={autocomplete} />
      </Box>
      {!autocompleteState?.isOpen && (
        <>
          <Typography variant='body2' px={1} fontWeight={600}>
            CONTACTS
          </Typography>
          <Box>
            <List>
              {data!.map((contact, index) => (
                <Contact
                  key={contact?.uid || index}
                  contact={contact}
                  isLoading={isPlaceholderData}
                />
              ))}
            </List>
          </Box>
        </>
      )}
      <SearchResults
        autocomplete={autocomplete}
        autocompleteState={autocompleteState}
      />
    </>
  )
}

type ResponsiveDrawerProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const drawerWidth = 300

const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = props => {
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.up('md'))

  const { open, setOpen } = props
  const closeContacts = () => {
    setOpen(false)
  }

  return (
    <Drawer
      open={open}
      anchor='left'
      variant={matches ? 'permanent' : 'temporary'}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: drawerWidth },
        },
      }}
    >
      <Container maxWidth={false}>
        <Box position='relative'>
          <Hidden mdUp>
            <IconButton
              sx={{ position: 'absolute', left: 0, top: 12 }}
              onClick={closeContacts}
            >
              <ArrowBackIcon />
            </IconButton>
          </Hidden>
          <BrandName
            to='/dashboard'
            fontSize={20}
            py={2}
            sx={{
              textAlign: {
                xs: 'center',
                md: 'left',
              },
            }}
          />
        </Box>
        <ContactsMenu />
      </Container>
    </Drawer>
  )
}

type DashboardHeaderProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const dashboardHeaderHeight = 120

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ setOpen }) => {
  const navigate = useNavigate()
  const user = useUser()
  const popper = usePopper<HTMLButtonElement>()

  const toggleContacts = () => {
    setOpen(prev => !prev)
  }

  const navigateTo = (to: To) => () => {
    popper.handlePopperClose()
    navigate(to)
  }

  const signOutButtonRef = React.useRef<HTMLButtonElement>(null)

  const signOut = () => {
    authService.signOut()
  }

  return (
    <Header height={dashboardHeaderHeight} position='absolute' sx={{ px: 3 }}>
      <Hidden mdUp>
        <IconButton sx={{ mr: 'auto' }} onClick={toggleContacts}>
          <GroupIcon />
        </IconButton>
      </Hidden>
      <Hidden smDown>
        <Typography variant='h6' mr='auto'>
          Welcome back, Ana!
        </Typography>
      </Hidden>
      <IconButton sx={{ ml: 'auto' }}>
        <NotificationsIcon />
      </IconButton>
      <IconButton
        id='account-button'
        aria-controls={popper.open ? 'account-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={popper.open ? 'true' : undefined}
        onClick={popper.handlePopperToggle}
        sx={{ ml: 1 }}
      >
        <AccountCircleIcon />
      </IconButton>
      <Popper {...popper.getPopperProps()}>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            <MenuItem
              onClick={navigateTo(`/profiles/${user.uid}`)}
              dense
              sx={{
                justifyContent: 'center',
                mb: 1,
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={navigateTo('/settings/general')}
              dense
              sx={{
                justifyContent: 'center',
                mb: 1,
              }}
            >
              Settings
            </MenuItem>
            <MenuItem
              onKeyUp={e => e.key === '13' && signOutButtonRef.current!.click()}
              disableRipple
              disableTouchRipple
              sx={{
                py: 1,
                borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                cursor: 'default',
                ':hover': { backgroundColor: 'transparent' },
              }}
            >
              <Button
                ref={signOutButtonRef}
                size='small'
                color='primary'
                onClick={signOut}
              >
                Sign Out
              </Button>
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </Header>
  )
}

const DashboardWindow: React.FC = props => {
  return (
    <Box
      id='dashboard-window'
      height='100vh'
      width={{
        xs: '100%',
        md: `calc(100% - ${drawerWidth}px)`,
      }}
      ml='auto'
      px={3}
      position='relative'
      display='flex'
      flexDirection='column'
      sx={{
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
      children={props.children}
    />
  )
}

const DashboardLayout: React.FC = props => {
  const [open, setOpen] = React.useState(false)

  return (
    <Box position='relative'>
      <GlobalStyles
        styles={{
          body: { background: '#f8fafb' },
        }}
      />
      <ResponsiveDrawer open={open} setOpen={setOpen} />
      <DashboardWindow>
        <DashboardHeader setOpen={setOpen} />
        <Container
          component='main'
          maxWidth='lg'
          sx={{
            position: 'relative',
            height: `calc(100% - ${dashboardHeaderHeight}px)`,
            // height: '100%',
            pt: `${dashboardHeaderHeight}px`,
            mb: { xs: 2, lg: 5 },
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {props.children}
        </Container>
      </DashboardWindow>
    </Box>
  )
}

export default DashboardLayout

// const [contactsState, setContactsState] = React.useState(() => {
//   const numOfContacts = Object.keys(contactIds.data || {}).length
//   return {
//     isLoading: numOfContacts > 0,
//     numOfContacts,
//     numOfContactsLoaded: 0,
//   }
// })

// const onLoaded = React.useCallback(() => {
//   setContactsState(prevState => {
//     const numOfContactsLoaded = prevState.numOfContactsLoaded + 1
//     return {
//       ...prevState,
//       isLoading: prevState.numOfContacts === numOfContactsLoaded,
//     }
//   })
// }, [])

// React.useEffect(() => {
//   if (firestore.contacts.length === 0) {
//     return undefined
//   }

//   const unsubscribe = usersService.onContactsStatusSnapshot(
//     firestore.contacts.map(({ uid }) => uid),
//     snapshot => {
//       snapshot.docs.forEach(doc => {
//         const data = doc.data()
//         if (data.state === 'online') {
//           contactsOnline.add(doc.id)
//         } else {
//           contactsOnline.delete(doc.id)
//         }
//       })

//       setContacts([
//         ...firestore.contacts.filter(({ uid }) => contactsOnline.has(uid)),
//         ...firestore.contacts.filter(({ uid }) => !contactsOnline.has(uid)),
//       ])
//     },
//     err => console.log(err)
//   )

//   return unsubscribe
// }, [firestore.contacts])
