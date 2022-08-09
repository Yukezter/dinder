import React from 'react'
import debounce from 'lodash.debounce'
import { useNavigate, useLocation, matchPath } from 'react-router-dom'
import { useIsMutating } from 'react-query'
import { useSearchBox, useConfigure, useHits, Highlight } from 'react-instantsearch-hooks-web'
import { Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import useAutocomplete from '@mui/material/useAutocomplete'
import Box, { BoxProps } from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Skeleton from '@mui/material/Skeleton'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Hidden from '@mui/material/Hidden'
import Divider from '@mui/material/Divider'
import GroupIcon from '@mui/icons-material/Group'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ListSubheader from '@mui/material/ListSubheader'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton, { ListItemButtonProps } from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText, { ListItemTextProps } from '@mui/material/ListItemText'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import ContactPageIcon from '@mui/icons-material/ContactPage'
import NoContactsIcon from '@mui/icons-material/ImportContacts'
import DeleteIcon from '@mui/icons-material/Delete'

import { User } from '../types'
import { AuthService } from '../services/auth'
import { useUser, useUIContext, AlgoliaSearch } from '../context'
import { useGetContacts, useDeleteContact, useBlockUser } from '../hooks'
import {
  IconButton,
  Header,
  BrandNameLink,
  TextField,
  Avatar,
  PopperMenu,
  NoData,
} from '../common/components'

const ContactPopperMenu: React.FC<{ contact: User }> = ({ contact }) => {
  const deleteContact = useDeleteContact()
  const blockContact = useBlockUser()
  // const isMutating = useIsMutating(['contacts', contact.uid]) > 0

  return (
    <PopperMenu id='contact-menu-button' menuId='contact-menu'>
      {({ menuListProps, handleClose }) => (
        <MenuList {...menuListProps}>
          <MenuItem
            // disabled={isMutating}
            onClick={event => {
              deleteContact.mutate(contact)
              handleClose(event)
            }}
          >
            Remove
          </MenuItem>
          <MenuItem
            sx={{ color: 'error.main' }}
            // disabled={isMutating}
            onClick={event => {
              blockContact.mutate(contact)
              handleClose(event)
            }}
          >
            Block
          </MenuItem>
        </MenuList>
      )}
    </PopperMenu>
  )
}

type ListItemUserProps = ListItemProps & {
  user?: User
  dividerTop?: boolean
  ListItemButtonProps?: ListItemButtonProps
  ListItemTextProps?: ListItemTextProps
}

const ListItemUser: React.FC<ListItemUserProps> = React.memo(props => {
  const {
    user,
    dividerTop,
    ListItemButtonProps = {},
    ListItemTextProps = {},
    ...ListItemProps
  } = props
  const { sx: listItemSx = [] } = ListItemProps
  const { sx: listItemButtonSx = [] } = ListItemButtonProps
  const { primary = user?.name, secondary = user?.username } = ListItemTextProps

  return (
    <ListItem
      disablePadding
      divider
      sx={[
        {
          ...(dividerTop && {
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: 'divider',
          }),
        },
        ...(Array.isArray(listItemSx) ? listItemSx : [listItemSx]),
      ]}
      {...ListItemProps}
    >
      <ListItemButton
        disabled={!user}
        {...ListItemButtonProps}
        sx={[
          {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          ...(Array.isArray(listItemButtonSx) ? listItemButtonSx : [listItemButtonSx]),
        ]}
      >
        <ListItemAvatar>
          <Avatar isLoading={!user} id={user?.uid} alt={user?.name} src={user?.photoURL} />
        </ListItemAvatar>
        <ListItemText
          {...ListItemTextProps}
          primary={!user ? <Skeleton width='80%' /> : primary}
          primaryTypographyProps={{ noWrap: true }}
          secondary={!user ? <Skeleton width='50%' /> : <>@{secondary}</>}
          secondaryTypographyProps={{ noWrap: true }}
        />
      </ListItemButton>
    </ListItem>
  )
})

const ContactsList = () => {
  const ui = useUIContext()
  const contacts = useGetContacts<User[]>({
    select: data => data.added.sort((a, b) => a.name.localeCompare(b.name)),
  })

  const data = React.useMemo(() => {
    if (contacts.isLoading || !contacts.data) {
      return Array.from<undefined>(Array(5))
    }

    return contacts.data
  }, [contacts.isLoading, contacts.data])

  return data.length > 0 ? (
    <List
      // title='Contacts'
      subheader={
        <ListSubheader
          sx={{
            lineHeight: 'normal',
            py: 0.5,
            // background: 'background.gradient',
            // color: 'inherit',
            // borderRadius: 1,
          }}
        >
          CONTACTS
        </ListSubheader>
      }
    >
      {data.map((contact, index) => (
        <ListItemUser
          key={contact?.uid || index}
          user={contact}
          // dividerTop={index === 0}
          secondaryAction={contact && <ContactPopperMenu contact={contact} />}
          // secondaryAction={
          //   <IconButton>
          //     <DeleteIcon />
          //   </IconButton>
          // }
          ListItemButtonProps={{ onClick: () => ui.profile.open(contact) }}
          ListItemTextProps={{ sx: { mr: 1.5 } }}
        />
      ))}
    </List>
  ) : (
    <NoData
      icon={<NoContactsIcon fontSize='large' />}
      title='No Contacts'
      description='Use the search bar above to find and add users to your contacts!'
      maxWidth={200}
    />
  )
}

const searchInputHeight = 40

const ContactsAutocomplete: React.FC<BoxProps> = props => {
  const ui = useUIContext()

  useConfigure({
    hitsPerPage: 5,
    disableTypoToleranceOnAttributes: ['name', 'username'],
  })

  const [inputValue, setInputValue] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  // const [isLoading, setIsLoading] = React.useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(
    debounce((query: string, search: (query: string) => void) => {
      search(query)
    }, 250),
    []
  )

  const queryHook = React.useCallback(
    (query: string, search: (query: string) => void) => {
      // setIsLoading(true)
      debouncedSearch(query, search)
    },
    [debouncedSearch]
  )

  const { query, refine } = useSearchBox({ queryHook })
  const { hits: options, results } = useHits<User>()

  // React.useEffect(() => {
  //   setIsLoading(false)
  // }, [results])

  const noResults = React.useMemo(() => {
    return results && results.nbHits === 0
  }, [results?.nbHits])

  const {
    getRootProps,
    getInputProps,
    getInputLabelProps,
    getClearProps,
    getListboxProps,
    getOptionProps,
    focused,
    popupOpen,
    groupedOptions,
  } = useAutocomplete({
    id: 'autocomplete-user-search',
    open: isOpen && Boolean(inputValue),
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    options,
    clearOnEscape: true,
    clearOnBlur: false,
    disableCloseOnSelect: true,
    openOnFocus: false,
    getOptionLabel: option => `@${option.username}`,
    filterOptions: options => options,
    isOptionEqualToValue: (option, value) => option.uid === value.uid,
    inputValue,
    onInputChange: (event, newInputValue, reason) => {
      if (reason !== 'reset') {
        setInputValue(newInputValue)
        refine(newInputValue)
      }
    },
    value: null,
    onChange: (event, value) => {
      if (value) {
        ui.profile.open(value)
      }
    },
  })

  const renderOptions = () => (
    <List
      // title='Search results'
      subheader={<ListSubheader sx={{ lineHeight: 'normal', py: 0.5 }}>RESULTS</ListSubheader>}
    >
      {(groupedOptions as typeof options).map((option, index) => (
        <ListItemUser
          {...getOptionProps({ option, index })}
          key={option.uid}
          user={option}
          // dividerTop={index === 0}
          ListItemTextProps={{
            primary: <Highlight hit={option} attribute='name' highlightedTagName='strong' />,
            secondary: <Highlight hit={option} attribute='username' highlightedTagName='strong' />,
          }}
        />
      ))}
    </List>
  )

  return (
    <Box {...props}>
      <Box {...getRootProps()}>
        <TextField
          id='search'
          placeholder='Search for users!'
          fullWidth
          sx={{ mb: 2 }}
          hiddenLabel
          value={inputValue}
          InputLabelProps={{
            shrink: false,
            ...getInputLabelProps(),
          }}
          inputProps={{ ...getInputProps() }}
          InputProps={{
            sx: {
              height: searchInputHeight,
              borderRadius: 5,
              '& .clearButton': {
                visibility: focused && inputValue ? 'visible' : 'hidden',
              },
              '&:hover .clearButton': {
                visibility: inputValue ? 'visible' : 'hidden',
              },
            },
            startAdornment: (
              <InputAdornment position='start' disablePointerEvents>
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton className='clearButton' {...(getClearProps() as any)} size='small'>
                  <CloseIcon fontSize='small' />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {popupOpen && (
          <Box {...(getListboxProps() as any)}>
            {Boolean(query) &&
              (noResults ? (
                <ListItem component='div'>
                  <ListItemText primary={`No results for "${query}"`} />
                </ListItem>
              ) : (
                renderOptions()
              ))}
          </Box>
        )}
      </Box>
      {!popupOpen && <ContactsList />}
    </Box>
  )
}

const drawerWidth = 300

const ContactsDrawer: React.FC = props => {
  const isMdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))
  const location = useLocation()
  const isSettingsPath = matchPath(
    {
      path: 'settings',
      end: false,
    },
    location.pathname
  )

  const ui = useUIContext()

  React.useEffect(() => {
    ui.contacts.close()
  }, [location])

  return (
    <Drawer
      open={ui.contacts.isOpen}
      anchor='left'
      variant={isMdUp && !isSettingsPath ? 'permanent' : 'temporary'}
      sx={{
        width: { xs: '100%', md: drawerWidth },
        flexShrink: 0,
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: drawerWidth },
        },
      }}
    >
      <Container maxWidth='sm'>
        <Header
          position='static'
          elevation={0}
          sx={{ mb: 2 }}
          ToolbarProps={{ disableGutters: true }}
        >
          <Hidden mdUp>
            <div style={{ flex: 1 }}>
              <IconButton onClick={ui.contacts.close}>
                <ArrowBackIcon />
              </IconButton>
            </div>
            <BrandNameLink color='primary' />
            <div style={{ flex: 1 }} />
          </Hidden>
        </Header>
        <AlgoliaSearch>
          <ContactsAutocomplete />
        </AlgoliaSearch>
      </Container>
    </Drawer>
  )
}

const UserPopperMenu = () => {
  const navigate = useNavigate()
  const user = useUser()
  const ui = useUIContext()

  const signOut = () => {
    AuthService.signOut()
  }

  return (
    <PopperMenu
      id='user-menu-button'
      menuId='user-menu'
      icon={<Avatar alt={user.name} src={user.photoURL} size={24} />}
    >
      {({ menuListProps, handleClose }) => (
        <MenuList {...menuListProps}>
          <MenuItem
            onClick={event => {
              handleClose(event)
              ui.profile.open(user)
            }}
          >
            <ListItemIcon>
              <ContactPageIcon />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem
            onClick={event => {
              handleClose(event)
              navigate('/settings/general')
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={event => {
              handleClose(event)
              signOut()
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            Logout
          </MenuItem>
        </MenuList>
      )}
    </PopperMenu>
  )
}

const DashboardHeader: React.FC = () => {
  const ui = useUIContext()

  return (
    <Header
      sx={theme => ({
        color: theme.palette.getContrastText(theme.palette.text.primary),
        background: theme.palette.background.gradient,
        [theme.breakpoints.up('md')]: {
          zIndex: theme => theme.zIndex.drawer + 1,
        },
      })}
    >
      <Hidden mdUp>
        <div style={{ flex: 1 }}>
          <IconButton onClick={ui.contacts.toggle}>
            <GroupIcon />
          </IconButton>
        </div>
      </Hidden>
      <BrandNameLink />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton>
          <NotificationsIcon />
        </IconButton>
        <UserPopperMenu />
      </div>
    </Header>
  )
}

export const Layout: React.FC = props => {
  const { children } = props

  return (
    <Box
      // minHeight={{ xs: 'var(--app-height, 100vh)', md: 'var(--app-height-min, 100vh)' }}
      minHeight={{ md: 'var(--app-height-min, 100vh)' }}
      height='var(--app-height, 100vh)'
      width='100%'
      ml='auto'
      position='relative'
      display='flex'
    >
      <ContactsDrawer />
      <DashboardHeader />
      <Container
        component='main'
        maxWidth='lg'
        sx={theme => ({
          position: 'relative',
          minHeight: '100%',
          pb: { xs: 2, lg: 3 },
          px: { xs: 3, sm: 5 },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // flexShrink: 0,
        })}
      >
        <Toolbar sx={{ mb: { xs: 1.5, md: 3 } }} />
        {children}
      </Container>
    </Box>
  )
}
