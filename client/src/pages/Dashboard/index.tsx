import React from 'react'
import { To, useNavigate, useLocation } from 'react-router-dom'
import { useIsMutating } from 'react-query'
import { Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Skeleton from '@mui/material/Skeleton'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Hidden from '@mui/material/Hidden'
import GroupIcon from '@mui/icons-material/Group'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import SadFaceIcon from '@mui/icons-material/SentimentDissatisfied'
import MenuDotsIcon from '@mui/icons-material/MoreVert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useUser, User } from '../../context/FirestoreContext'
import { useProfile } from '../../context/ProfileViewContext'
import { useContactsMenu } from '../../context/ContactsMenuContext'
import { AuthService } from '../../services/auth'
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

const SearchInput: React.FC<{
  autocomplete: Autocomplete
  status?: string
  isOpen?: boolean
}> = React.memo(props => {
  const { autocomplete, isOpen, status } = props

  const handleClearSearch = () => {
    if (autocomplete) {
      autocomplete.setQuery('')
      autocomplete.setCollections([])
    }
  }

  return (
    <Box>
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
          endAdornment:
            status === 'loading' ? (
              <InputAdornment position='end'>
                <CircularProgress size={20} />
              </InputAdornment>
            ) : (
              isOpen && (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={handleClearSearch}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
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
})

type ListItemUserProps = ListItemProps & {
  isLoading?: boolean
  user?: User
  viewProfile?: () => void
  primary?: ListItemTextProps['primary']
  secondary?: ListItemTextProps['secondary']
}

const ListItemUser: React.FC<ListItemUserProps> = props => {
  const { isLoading, user, viewProfile, primary, secondary, ...listItemProps } =
    props

  return (
    <ListItem disableGutters divider {...listItemProps}>
      <ListItemButton
        role={undefined}
        onClick={viewProfile}
        disabled={isLoading}
        dense
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          ':hover': {
            backgroundColor: 'transparent',
            '& span': {
              textDecoration: 'underline',
            },
          },
          // ':not(:focus):hover': {
          //   backgroundColor: 'transparent',
          // },
        }}
      >
        <ListItemAvatar>
          <Avatar
            isLoading={isLoading}
            id={user?.uid}
            alt={user?.name}
            src={user?.photoURL}
          />
        </ListItemAvatar>
        <ListItemText
          primary={isLoading ? <Skeleton width='80%' /> : primary || user?.name}
          secondary={
            isLoading ? (
              <Skeleton width='50%' />
            ) : (
              <>@{secondary || user?.username}</>
            )
          }
        />
      </ListItemButton>
    </ListItem>
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
          {autocompleteState.status !== 'loading' &&
            autocompleteState!.collections.map(({ source, items }, index) => {
              return (
                <div key={`source-${index}`} className='aa-Source'>
                  {source.sourceId === 'recent' && items.length > 0 && (
                    <Typography
                      variant='body2'
                      px={1}
                      pt={1.5}
                      fontWeight={600}
                    >
                      RECENT
                    </Typography>
                  )}
                  {source.sourceId === 'users' && (
                    <Typography
                      variant='body2'
                      px={1}
                      pt={1.5}
                      fontWeight={600}
                    >
                      SEARCH RESULTS
                    </Typography>
                  )}

                  {items.length > 0 ? (
                    <List className='aa-List' {...autocomplete.getListProps()}>
                      {items.map(item => (
                        <ListItemUser
                          key={item.objectID}
                          className='aa-Item'
                          sx={{
                            '&[aria-selected="true"]:not(:hover) .MuiListItemButton-root':
                              {
                                backgroundColor: 'action.hover',
                              },
                          }}
                          secondaryAction={
                            source.sourceId === 'recent' ? (
                              <IconButton
                                aria-label='delete'
                                {...autocomplete.getRemoveRecentItemProps(item)}
                              >
                                <CloseIcon />
                              </IconButton>
                            ) : undefined
                          }
                          {...autocomplete.getItemProps({
                            item,
                            source,
                          })}
                          primary={item._highlightedParts.name.map(part => {
                            if (!part.isHighlighted) return part.value
                            return (
                              <strong key={part.value}>{part.value}</strong>
                            )
                          })}
                          secondary={item._highlightedParts.username.map(
                            part => {
                              if (!part.isHighlighted) return part.value
                              return (
                                <strong key={part.value}>{part.value}</strong>
                              )
                            }
                          )}
                          user={{
                            uid: item.objectID,
                            photoURL: item.photoURL,
                            name: item.name,
                            username: item.username,
                            about: item.about,
                          }}
                        />
                      ))}
                    </List>
                  ) : (
                    !!autocompleteState.query &&
                    autocompleteState.status === 'idle' &&
                    source.sourceId === 'users' && (
                      <Box display='flex' alignItems='center' p={2}>
                        <Avatar sx={{ mr: 2 }}>
                          <SadFaceIcon />
                        </Avatar>
                        <Typography>No Users Found</Typography>
                      </Box>
                    )
                  )}
                </div>
              )
            })}
        </>
      )}
    </Box>
  )
}

type ContactPopperProps = {
  contact?: User
}

const ContactPopper: React.FC<ContactPopperProps> = ({ contact }) => {
  const popper = usePopper<HTMLButtonElement>()
  const deleteContact = useDeleteContact(contact)
  const blockContact = useBlockContact(contact)
  const isMutating = useIsMutating(['contacts', contact?.uid]) > 0

  const handleDeleteContact = () => {
    popper.handlePopperClose()
    deleteContact.mutate(contact!)
  }

  const handleBlockContact = () => {
    popper.handlePopperClose()
    blockContact.mutate(contact!)
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
            <MenuItem dense onClick={handleDeleteContact} disabled={isMutating}>
              Remove
            </MenuItem>
            <MenuItem
              dense
              sx={{ color: t => t.palette.error.main }}
              onClick={handleBlockContact}
              disabled={isMutating}
            >
              Block
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

const ContactsMenu: React.FC = props => {
  const { viewProfile } = useProfile()
  const { autocomplete, autocompleteState } = useSearch(viewProfile)
  const { data, isPlaceholderData } = useGetContacts({
    cacheTime: 60 * 60 * 1000,
    staleTime: Infinity,
    placeholderData: Array.from(Array(5)).fill(undefined),
  })

  return (
    <>
      <Box className='aa-Autocomplete' {...autocomplete.getRootProps({})}>
        <Typography variant='body2' px={1} py={1.5} fontWeight={600}>
          CONTACTS
        </Typography>
        <SearchInput
          autocomplete={autocomplete}
          status={autocompleteState?.status}
          isOpen={autocompleteState?.isOpen}
        />
      </Box>
      {!autocompleteState?.isOpen && (
        <Box>
          <List>
            {data!.map((contact, index) => (
              <ListItemUser
                key={contact?.uid || index}
                user={contact}
                viewProfile={() => viewProfile(contact)}
                isLoading={isPlaceholderData}
                secondaryAction={
                  contact &&
                  !isPlaceholderData && <ContactPopper contact={contact} />
                }
              />
            ))}
          </List>
        </Box>
      )}
      <SearchResults
        autocomplete={autocomplete}
        autocompleteState={autocompleteState}
      />
    </>
  )
}

const drawerWidth = 300

const ResponsiveDrawer: React.FC = props => {
  const matches = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))
  const contactsMenu = useContactsMenu()
  const location = useLocation()

  React.useEffect(() => {
    contactsMenu.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  return (
    <Drawer
      open={contactsMenu.open}
      anchor='left'
      variant={matches ? 'permanent' : 'temporary'}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: drawerWidth },
          borderRight: 0,
        },
      }}
    >
      <Container maxWidth={false} disableGutters>
        <Header
          position='static'
          elevation={0}
          sx={{
            color: 'white',
            background: 'linear-gradient(#de59a9, #fa6715)',
            px: { sm: 2 },
          }}
        >
          <Toolbar
            component={Container}
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Hidden mdUp>
              <IconButton
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: 0,
                  bottom: 0,
                  color: 'white',
                }}
                onClick={contactsMenu.close}
              >
                <ArrowBackIcon />
              </IconButton>
            </Hidden>
            <BrandName to='/dashboard' fontSize={20} />
          </Toolbar>
        </Header>
      </Container>
      <Container
        maxWidth={false}
        sx={{
          height: '100%',
          position: 'relative',
          '::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            height: '100%',
            width: '1px',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <ContactsMenu />
      </Container>
    </Drawer>
  )
}

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate()
  const user = useUser()
  const contactsMenu = useContactsMenu()
  const popper = usePopper<HTMLButtonElement>()

  const navigateTo = (to: To) => () => {
    popper.handlePopperClose()
    navigate(to)
  }

  const signOutButtonRef = React.useRef<HTMLButtonElement>(null)

  const signOut = () => {
    AuthService.signOut()
  }

  return (
    <Header
      position='fixed'
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        color: 'white',
        background: 'linear-gradient(#de59a9, #fa6715)',
        px: { sm: 2 },
      }}
    >
      <Toolbar component={Container} maxWidth='lg'>
        <Hidden mdUp>
          <IconButton sx={{ mr: 'auto' }} onClick={contactsMenu.toggle}>
            <GroupIcon />
          </IconButton>
        </Hidden>
        <Hidden mdUp>
          <BrandName
            to='/dashboard'
            fontSize={20}
            position='absolute'
            top={0}
            bottom={0}
            left='50%'
            sx={{ transform: 'translateX(-50%)' }}
            display='flex'
            justifyContent='center'
            alignItems='center'
          />
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
          sx={{ ml: 0.5 }}
        >
          <Avatar alt={user.name} src={user.photoURL} size={24} />
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
                onKeyUp={e =>
                  e.key === '13' && signOutButtonRef.current!.click()
                }
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
      </Toolbar>
    </Header>
  )
}

const DashboardWindow: React.FC = props => {
  return (
    <Box
      id='dashboard-window'
      minHeight='100%'
      width={{
        xs: '100%',
        md: `calc(100% - ${drawerWidth}px)`,
      }}
      ml='auto'
      position='relative'
      display='flex'
      flexDirection='column'
      children={props.children}
    />
  )
}

const DashboardLayout: React.FC = props => {
  return (
    <>
      <ResponsiveDrawer />
      <DashboardWindow>
        <DashboardHeader />
        <Container
          component='main'
          maxWidth='lg'
          sx={theme => ({
            position: 'relative',
            minHeight: '100%',
            pb: { xs: 2, lg: 4 },
            px: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          })}
        >
          <Toolbar sx={{ mb: 3 }} />
          {props.children}
        </Container>
      </DashboardWindow>
    </>
  )
}

export default DashboardLayout
