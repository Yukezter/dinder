import React from 'react'
import { Timestamp } from 'firebase/firestore'
// import { useIsMutating } from 'react-query'
import { DateTime } from 'luxon'
import { useTable, useSortBy, Column, CellProps } from 'react-table'
// import {
//   SwitchTransition,
//   TransitionGroup,
//   CSSTransition,
//   Transition,
// } from 'react-transition-group'
// import { motion, AnimatePresence } from 'framer-motion'
import { visuallyHidden } from '@mui/utils'
// import { getTransitionProps } from '@mui/material/transitions/utils'
import { Theme } from '@mui/material/styles'
// import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Hidden from '@mui/material/Hidden'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
// import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Toolbar from '@mui/material/Toolbar'
import Table from '@mui/material/Table'
import TableContainer from '@mui/material/TableContainer'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableSortLabel from '@mui/material/TableSortLabel'
// import Fade from '@mui/material/Fade'
// import Tabs from '@mui/material/Tabs'
// import Tab from '@mui/material/Tab'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import NoPartiesIcon from '@mui/icons-material/Groups'
import NoBusinessesIcon from '@mui/icons-material/Store'

import { PopulatedParty, Business } from '../types'
import { useUser, useParties, useUIContext } from '../context'
import { useGetBusinesses, useDeleteParty, useDeleteBusiness } from '../hooks'
import { ListItemBusiness } from '../common/components'
import { Link, Avatar, UserAvatarGroup, PopperMenu, NoData } from '../common/components'

type CardPopperMenuProps = {
  party?: PopulatedParty
}

const CardPopperMenu = ({ party }: CardPopperMenuProps) => {
  const user = useUser()
  const leaveParty = useDeleteParty()
  // const isMutating = useIsMutating(['parties', party?.id]) > 0
  const ui = useUIContext()

  return (
    <PopperMenu id='card-menu-button' menuId='card-menu' IconButtonProps={{ size: 'small' }}>
      {({ menuListProps, handleClose }) => (
        <MenuList {...menuListProps}>
          {user.uid === party?.admin && (
            <MenuItem
              // disabled={isMutating}
              onClick={() => {
                handleClose()
                if (party) {
                  ui.party.open(party)
                }
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              Settings
            </MenuItem>
          )}
          <MenuItem
            // disabled={isMutating}
            onClick={() => {
              handleClose()
              if (party) {
                leaveParty.mutate(party)
              }
            }}
          >
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            {user.uid === party?.admin ? 'Delete' : 'Leave'}
          </MenuItem>
        </MenuList>
      )}
    </PopperMenu>
  )
}

const CreatePartyCard: React.FC = () => {
  const ui = useUIContext()

  return (
    <Card sx={{ maxWidth: CARD_MAX_WIDTH, mx: 'auto', borderRadius: 8 }}>
      <CardActionArea
        onClick={() => ui.party.open()}
        sx={{
          height: { xs: 136, sm: 180 },
          borderRadius: 'inherit',
          display: 'flex',
        }}
      >
        <CardContent>
          <Stack spacing={2} alignItems='center'>
            <Typography fontWeight={600} noWrap>
              Create
            </Typography>
            <Avatar
              alt='Create Party Icon'
              size='small'
              sx={theme => ({
                background: theme.palette.primary.main,
              })}
            >
              <AddIcon />
            </Avatar>
            <Typography variant='caption' noWrap>
              Create a party!
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const colors = ['#fbddcc', '#fcf1d4', '#ffc8c8']

type PartyCardProps = {
  party?: PopulatedParty
  index: number
}

const CARD_MAX_WIDTH = 300

const PartyCard: React.FC<PartyCardProps> = props => {
  const { party, index } = props
  const isSmUp = useMediaQuery<Theme>(theme => theme.breakpoints.up('sm'))

  const admin = React.useMemo(() => {
    return party?.members.find(({ uid }) => uid === party.admin)
  }, [party])

  return (
    <Card
      sx={{
        mx: 'auto',
        maxWidth: CARD_MAX_WIDTH,
        height: { xs: 136, sm: 180 },
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        borderRadius='inherit'
        bgcolor={colors[index]}
        flex={1}
        display='flex'
        flexDirection='column'
      >
        <CardHeader
          action={party && <CardPopperMenu party={party} />}
          avatar={isSmUp && <Avatar alt={admin?.name} src={admin?.photoURL} size='small' />}
          title={
            !party ? (
              <Skeleton width={80} />
            ) : (
              <Link to={`/party/${party.id}`} underline='hover' noWrap display='block'>
                {party.name}
              </Link>
            )
          }
          disableTypography
          subheader={
            !party ? (
              <Skeleton width={50} />
            ) : (
              <Typography variant='caption' component='div' noWrap>
                @{admin?.username}
              </Typography>
            )
          }
          sx={{
            pb: 0,
            '& .MuiCardHeader-content': {
              minWidth: 0,
            },
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex' }}>
          <UserAvatarGroup
            total={party?.members.length}
            users={party?.members}
            sx={theme => ({
              m: 'auto',
              [theme.breakpoints.down(400)]: {
                '& .MuiAvatarGroup-avatar': {
                  height: 28,
                  width: 28,
                  fontSize: 'inherit',
                },
              },
            })}
          />
        </CardContent>
      </Box>
      <Hidden smDown>
        <Typography variant='caption' component='div' noWrap align='center' p={1}>
          {!party ? <Skeleton width='60%' /> : party.location.description}
        </Typography>
      </Hidden>
    </Card>
  )
}

interface PartiesTableProps {
  isLoading: boolean
  data: PopulatedParty[]
}

const TableToolbar: React.FC<PartiesTableProps> = ({ isLoading, data }) => {
  const ui = useUIContext()

  return (
    <Toolbar
      variant='dense'
      disableGutters
      sx={{
        p: 3,
        pb: 0,
      }}
    >
      <Box sx={{ flex: '1 1 100%' }}>
        <Typography variant='h6' id='tableTitle' component='div'>
          Parties
        </Typography>
        {/* {!isLoading && (
          <Typography variant='caption' component='div'>
            {data.length} {data.length === 1 ? 'party' : 'parties'}
          </Typography>
        )} */}
      </Box>
      <IconButton
        color='primary'
        size='small'
        sx={theme => ({
          background: theme.palette.primary.main,
          color: theme.palette.background.paper,
          ':hover': {
            background: theme.palette.primary.dark,
          },
        })}
        onClick={() => ui.party.open()}
      >
        <AddIcon />
      </IconButton>
    </Toolbar>
  )
}

const PartiesTable: React.FC<PartiesTableProps> = props => {
  const { isLoading, data } = props

  const isSmUp = useMediaQuery<Theme>(theme => theme.breakpoints.up(480))
  const isMdUp = useMediaQuery<Theme>(theme => theme.breakpoints.up(730))

  const columns = React.useMemo(() => {
    let cols: Column<PopulatedParty>[] = [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value, row }) => {
          return (
            <Box display='flex' alignItems='center'>
              <Hidden lgDown>
                <UserAvatarGroup
                  users={row.original.members}
                  sx={{
                    '& .MuiAvatarGroup-avatar': {
                      height: 28,
                      width: 28,
                      fontSize: 'inherit',
                    },
                  }}
                />
              </Hidden>
              <Link to={`/party/${row.original.id}`} underline='hover' noWrap display='block'>
                {value}
              </Link>
            </Box>
          )
        },
      },
      {
        Header: 'Role',
        accessor: 'admin',
        Cell: ({ value }) => {
          const user = useUser()
          return (
            <Chip label={value === user.uid ? 'Admin' : 'Member'} size='small' variant='outlined' />
          )
        },
      },
      {
        Header: 'Status',
        accessor: 'active',
        Cell: ({ value }) => (
          <Chip
            label={value ? 'Active' : 'Inactive'}
            variant='outlined'
            size='small'
            color={value ? 'success' : 'error'}
          />
        ),
      },
      {
        Header: 'Last Active',
        id: 'lastActive',
        accessor: ({ lastActive }) => lastActive.toMillis(),
        sortType: 'number',
        Cell: ({ value, row }: CellProps<PopulatedParty, number>) => {
          const [now, setNow] = React.useState(DateTime.now())
          const timerRef = React.useRef<NodeJS.Timer | number>()

          React.useEffect(() => {
            if (!row.original.active) {
              setNow(DateTime.now())

              timerRef.current = setInterval(() => {
                setNow(DateTime.now())
              }, 1000 * 60)

              return () => {
                clearInterval(timerRef.current as number)
              }
            }
          }, [row.original.active])

          const relativeTime = React.useMemo(() => {
            return now.minus(new Date().getTime() - value).toRelative()
          }, [now, value])

          if (row.original.active) {
            return 'Now'
          }

          return relativeTime
        },
      },
      {
        id: 'menu',
        Cell: ({ row }: CellProps<PopulatedParty, boolean>) => (
          <CardPopperMenu party={row.original} />
        ),
      },
    ]

    if (isLoading) {
      cols = cols.map(({ id, accessor, ...col }, index) => ({
        ...col,
        id: index.toString(),
        Cell: <Skeleton />,
      }))
    }

    return cols
  }, [isLoading])

  const isDisabled = React.useMemo(() => {
    return isLoading || data.length === 0
  }, [isLoading, data])

  const {
    getTableProps,
    headerGroups,
    getTableBodyProps,
    prepareRow,
    rows,
    disableSortBy,
    visibleColumns,
    setHiddenColumns,
  } = useTable(
    {
      columns,
      data,
      autoResetSortBy: false,
      disableSortRemove: true,
      disableSortBy: isDisabled,
      initialState: {
        hiddenColumns: isMdUp ? [] : isSmUp ? ['active'] : ['active', 'lastActive'],
        sortBy: [
          {
            id: 'lastActive',
            desc: true,
          },
        ],
      },
    },
    useSortBy
  )

  React.useEffect(() => {
    setHiddenColumns(isMdUp ? [] : isSmUp ? ['active'] : ['active', 'lastActive'])
  }, [isMdUp, isSmUp, setHiddenColumns])

  return (
    <Paper
      sx={{
        minHeight: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableToolbar isLoading={isLoading} data={data} />
      <TableContainer
        sx={theme => ({
          overflowX: 'hidden',
          overflowY: isLoading ? 'hidden' : 'auto',
          px: 3,
          mt: 1,
          [theme.breakpoints.down('sm')]: {
            '& tr > th, & tr > td:last-of-type': {
              pl: 0,
            },
          },
        })}
      >
        <Table aria-labelledby='tableTitle' stickyHeader {...getTableProps()}>
          <TableHead>
            {headerGroups.map(headerGroup => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <TableCell
                    {...column.getHeaderProps()}
                    sx={{ whiteSpace: 'nowrap', bgcolor: 'transparent' }}
                    align={column.id === 'name' ? 'left' : 'right'}
                    sortDirection={column.isSorted ? (column.isSortedDesc ? 'desc' : 'asc') : false}
                  >
                    {column.id !== 'menu' && (
                      <TableSortLabel
                        {...column.getSortByToggleProps()}
                        active={disableSortBy ? false : column.isSorted}
                        direction={column.isSortedDesc ? 'desc' : 'asc'}
                        disabled={disableSortBy}
                        sx={{ color: disableSortBy ? 'text.disabled' : '' }}
                      >
                        {column.render('Header')}
                        {!disableSortBy && column.isSorted ? (
                          <Box component='span' sx={visuallyHidden}>
                            {column.isSortedDesc ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row)
              return (
                <TableRow {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                      <TableCell
                        {...cell.getCellProps()}
                        {...(cell.column.id === 'name'
                          ? {
                              component: 'th',
                              scope: 'row',
                            }
                          : { align: 'right' })}
                        sx={{
                          whiteSpace: 'nowrap',
                          ...(cell.column.id === 'name' && {
                            maxWidth: { xs: 150, sm: 280, md: 140, lg: 280 },
                          }),
                        }}
                      >
                        {cell.render('Cell')}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
            {rows.length > 0 && rows.length < 4 && (
              <TableRow
                sx={theme => ({
                  [theme.breakpoints.down('lg')]: {
                    height: (4 - rows.length) * 67,
                  },
                })}
              >
                <TableCell
                  colSpan={visibleColumns.length}
                  sx={{
                    p: 0,
                    borderBottom: 'none',
                  }}
                />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data.length === 0 && (
        <NoData
          icon={<NoPartiesIcon fontSize='large' />}
          title='No Parties'
          description={"You aren't a member of any parties."}
          p={2.5}
        />
      )}
    </Paper>
  )
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = props => {
  const { children, value, index, ...other } = props

  return (
    <div
      // role='tabpanel'
      hidden={value !== index}
      // id={`businesses-tabpanel-${index}`}
      // aria-labelledby={`businesses-tab-${index}`}
      style={{
        flexGrow: value === index ? 1 : 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      {...other}
    >
      {value === index && children}
    </div>
  )
}

type BusinessListProps = {
  data: undefined[] | Business[]
  isLoading: boolean
}

const BusinessList = ({ data, isLoading }: BusinessListProps) => {
  const deleteBusiness = useDeleteBusiness()

  const handleDeleteBusiness = (business?: Business) => () => {
    if (business) {
      deleteBusiness.mutate(business.details.id)
    }
  }

  if (!isLoading && data.length === 0) {
    return (
      <NoData
        icon={<NoBusinessesIcon fontSize='large' />}
        title='No Businesses'
        description='Favorite or block a business on the party page!'
        maxWidth={200}
        p={2.5}
      />
    )
  }

  return (
    <List sx={{ minHeight: 250 }}>
      {data.map((business, index) => (
        <ListItemBusiness
          key={business?.details.id || index}
          details={business?.details}
          divider={!isLoading && index !== data.length - 1}
          secondaryAction={
            !!business && (
              <IconButton onClick={handleDeleteBusiness(business)}>
                <DeleteIcon />
              </IconButton>
            )
          }
        />
      ))}
    </List>
  )
}

const Businesses = () => {
  const businessesQuery = useGetBusinesses<{
    favorites: Business[]
    blocked: Business[]
  }>({
    select: data => {
      return {
        favorites: data.filter(business => business.type === 'favorite'),
        blocked: data.filter(business => business.type === 'block'),
      }
    },
  })

  const isLoading = React.useMemo(() => {
    return !Boolean(businessesQuery.data)
  }, [businessesQuery.data])

  const data = React.useMemo(() => {
    if (!businessesQuery.data) {
      return {
        favorites: Array.from(Array<undefined>(3)),
        blocked: Array.from(Array<undefined>(3)),
      }
    }

    return businessesQuery.data
  }, [businessesQuery.data])

  const [tab, setTab] = React.useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number | null) => {
    if (newValue !== null) {
      setTab(newValue)
    }
  }

  return (
    <Paper
      sx={{
        minHeight: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack>
        <ToggleButtonGroup
          fullWidth
          color='primary'
          size='small'
          value={tab}
          exclusive
          onChange={handleTabChange}
          sx={{ alignSelf: 'center', mb: 2, p: 3, pb: 0 }}
        >
          <ToggleButton value={0}>Favorites</ToggleButton>
          <ToggleButton value={1}>Blocked</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Box
        flex={1}
        px={1}
        display='flex'
        flexDirection='column'
        minWidth={0}
        sx={{ overflowY: isLoading ? 'hidden' : 'auto' }}
      >
        <TabPanel value={tab} index={0}>
          <BusinessList data={data.favorites} isLoading={isLoading} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <BusinessList data={data.blocked} isLoading={isLoading} />
        </TabPanel>
      </Box>
    </Paper>
  )
}

export const Dashboard = () => {
  const user = useUser()
  const partiesQuery = useParties()

  const parties = React.useMemo(() => {
    if (partiesQuery.isLoading || !partiesQuery.data) {
      return {
        recent: Array(3).fill(undefined),
        all: Array(5).fill({}),
      }
    }

    const all = partiesQuery.data
      .map(party => {
        if (party.active) {
          return {
            ...party,
            lastActive: Timestamp.now(),
          }
        }

        return party
      })
      .sort((a, b) => b.lastActive.toMillis() - a.lastActive.toMillis())

    return { recent: all.slice(0, 3), all }
  }, [partiesQuery.isLoading, partiesQuery.data])

  return (
    <Box display='flex' flexDirection='column' flex={1} minHeight={{ lg: 0 }} mb={{ xs: 2, lg: 0 }}>
      <Typography variant='h6' pb={2}>
        {user.username && `Welcome back, @${user.username}!`}
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          Recent
        </Typography>
        <Grid
          container
          alignItems='stretch'
          columnSpacing={{ xs: 2, sm: 5 }}
          rowSpacing={{ xs: 2, sm: 5 }}
        >
          <Grid item xs={6} lg={3}>
            <CreatePartyCard />
          </Grid>
          {parties.recent.map((party, index) => (
            <Grid key={!party ? index : party.id} item xs={6} lg={3}>
              <PartyCard party={party} index={index} />
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Box display='flex' flex='1 1 1px' minHeight={{ lg: 0 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8} height={{ lg: '100%' }} display='flex' flexDirection='column'>
            <PartiesTable isLoading={partiesQuery.isLoading} data={parties.all} />
          </Grid>
          <Grid item xs={12} lg={4} height={{ lg: '100%' }} display='flex' flexDirection='column'>
            <Businesses />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

// const a11yProps = (index: number) => ({
//   id: `businesses-tab-${index}`,
//   role: 'tab',
//   'aria-controls': `businesses-tabpanel-${index}`,
// })

// const Businesses = () => {
//   const businessesQuery = useGetBusinesses<{
//     favorites: Business[]
//     blocked: Business[]
//   }>({
//     select(data) {
//       // data.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis())
//       return {
//         favorites: data.filter(business => business.type === 'favorite'),
//         blocked: data.filter(business => business.type === 'block'),
//       }
//     },
//   })

//   const isLoading = React.useMemo(() => {
//     return !Boolean(businessesQuery.data)
//   }, [businessesQuery.data])

//   const data = React.useMemo(() => {
//     if (!businessesQuery.data) {
//       return {
//         favorites: Array.from(Array<undefined>(4)),
//         blocked: Array.from(Array<undefined>(4)),
//       }
//     }

//     return businessesQuery.data
//   }, [businessesQuery.data])

//   const [tab, setTab] = React.useState(0)

//   const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
//     setTab(newValue)
//   }

//   return (
//     <Paper
//       sx={{
//         minHeight: 0,
//         flex: 1,
//         display: 'flex',
//         flexDirection: 'column',
//         p: 2,
//       }}
//     >
//       {/* <Typography variant='h6' component='div'>
//         Businesses
//       </Typography> */}
//       <Box>
//         <Tabs
//           aria-label='Your parties'
//           variant='fullWidth'
//           textColor='inherit'
//           value={tab}
//           onChange={handleTabChange}
//           sx={theme => ({
//             // background: theme.palette.background.gradient,
//             border: `1px solid ${theme.palette.divider}`,
//             borderRadius: theme.shape.borderRadius,
//           })}
//         >
//           <Tab label='Favorites' {...a11yProps(0)} sx={{ bgcolor: 'primary.main' }} />
//           <Tab label='Blocked' {...a11yProps(1)} />
//         </Tabs>
//       </Box>
//       <TabPanel value={tab} index={0}>
//         <BusinessList data={data.favorites} isLoading={isLoading} />
//       </TabPanel>
//       <TabPanel value={tab} index={1}>
//         <BusinessList data={data.blocked} isLoading={isLoading} />
//       </TabPanel>
//     </Paper>
//   )
// }

// const AnimatedRow: React.FC<{ row: Row<PopulatedParty>; theme: Theme }> = ({
//   row,
//   theme,
//   ...props
// }) => {
//   const nodeRef = React.useRef<HTMLTableRowElement>(null)
//   const heightRef = React.useRef(0)

//   const getHeight = React.useCallback(() => {
//     if (!nodeRef.current) {
//       return 0
//     }

//     return nodeRef.current.offsetHeight
//   }, [])

//   const forEachCellWrapper = React.useCallback((cb: (cell: HTMLElement) => void) => {
//     if (nodeRef.current) {
//       Array.from(nodeRef.current.children).forEach(child => {
//         if (child.firstElementChild) {
//           cb(child.firstElementChild as HTMLElement)
//         }
//       })
//     }
//   }, [])

//   const durations = React.useMemo(
//     () => ({
//       enter: theme.transitions.duration.enteringScreen,
//       exit: theme.transitions.duration.leavingScreen,
//       // enter: 5000,
//       // exit: 5000,
//     }),
//     [theme]
//   )

//   return (
//     <CSSTransition
//       nodeRef={nodeRef}
//       classNames='row'
//       timeout={durations}
//       onEnter={() => {
//         heightRef.current = getHeight()
//         forEachCellWrapper(node => {
//           node.style.height = '0px'
//         })
//       }}
//       onEntering={() => {
//         forEachCellWrapper(node => {
//           node.style.height = `${heightRef.current}px`
//           node.style.transitionDuration = `${durations.enter}ms`
//         })
//       }}
//       onEntered={() => {
//         forEachCellWrapper(node => {
//           node.style.height = 'auto'
//           node.style.transitionDuration = ''
//         })
//       }}
//       onExit={() => {
//         const height = getHeight()
//         forEachCellWrapper(node => {
//           node.style.height = `${height}px`
//         })
//       }}
//       onExiting={() => {
//         nodeRef.current!.style.borderBottom = 'none'
//         forEachCellWrapper(node => {
//           node.style.height = '0px'
//           node.style.transitionDuration = `${durations.exit}ms`
//         })
//       }}
//       {...props}
//     >
//       <TableRow
//         ref={nodeRef}
//         sx={{
//           '& .wrapper': {
//             bgcolor: 'green',
//             display: 'flex',
//             alignItems: 'center',
//             overflow: 'hidden',
//             transition: theme.transitions.create('height', {
//               easing: theme.transitions.easing.sharp,
//             }),
//           },
//           '& .wrapper .content': {
//             p: 2,
//             height: '100%',
//             flex: 1,
//             display: 'flex',
//             alignItems: 'center',
//           },
//           // Transition styles

//           // '&.row-enter .wrapper': {
//           //   height: 0,
//           //   transitionDuration: durations.enter,
//           // },
//           // '&.row-enter-active .wrapper': {
//           //   height: 67,
//           //   transition: theme.transitions.create('height', {
//           //     easing: theme.transitions.easing.sharp,
//           //     duration: durations.enter,
//           //   }),
//           // },
//           // '&.row-enter-done .wrapper': {
//           //   height: 'auto',
//           // },
//           // '&.row-exit .wrapper': {
//           //   height: 67,
//           // },
//           // '&.row-exit-active .wrapper': {
//           //   height: 0,
//           //   transition: theme.transitions.create('height', {
//           //     easing: theme.transitions.easing.sharp,
//           //     duration: durations.exit,
//           //   }),
//           // },
//         }}
//       >
//         {row.cells.map(cell => {
//           return (
//             <TableCell
//               {...cell.getCellProps()}
//               {...(cell.column.id === 'name'
//                 ? { component: 'th', scope: 'row' }
//                 : { align: 'right' })}
//               sx={{ p: 0 }}
//             >
//               <div className='wrapper'>
//                 <div
//                   className='content'
//                   {...(cell.column.id !== 'name' && { style: { justifyContent: 'flex-end' } })}
//                 >
//                   {cell.render('Cell')}
//                 </div>
//               </div>
//             </TableCell>
//           )
//         })}
//       </TableRow>
//     </CSSTransition>
//   )
// }

// const AnimatedRows = ({
//   rows,
//   prepareRow,
// }: {
//   rows: Row<PopulatedParty>[]
//   prepareRow: (row: Row<PopulatedParty>) => void
// }) => {
//   const theme = useTheme()

//   return (
//     <TransitionGroup component={null}>
//       {rows.map((row, index) => {
//         prepareRow(row)
//         return (
//           <AnimatedRow key={!row.original.id ? index : row.original.id} row={row} theme={theme} />
//         )
//       })}
//     </TransitionGroup>
//   )
// }

// type MotionRowsProps = {
//   rows: Row<PopulatedParty>[]
//   prepareRow: (row: Row<PopulatedParty>) => void
// }

// const RowComponent = React.forwardRef<HTMLTableRowElement, TableRowProps>((props, ref) => (
//   <TableRow ref={ref} sx={{ bgcolor: theme => theme.palette.background.paper }} {...props} />
// ))

// const MotionRow = React.memo(motion(RowComponent))

// const MotionRows: React.FC<MotionRowsProps> = ({ rows, prepareRow }) => {
//   const theme = useTheme()

//   const spring = React.useMemo(
//     () => ({
//       type: 'spring',
//       stiffness: 500,
//       damping: 25,
//     }),
//     []
//   )

//   return (
//     <AnimatePresence>
//       {rows.map((row, index) => {
//         prepareRow(row)
//         return (
//           <MotionRow
//             {...row.getRowProps()}
//             key={!row.original.id ? index : row.original.id}
//             layout
//             transition={spring}
//             initial={{ maxHeight: 0 }}
//             animate={{
//               transition: {
//                 ...spring,
//                 duration: theme.transitions.duration.leavingScreen,
//               },
//             }}
//             exit={{
//               maxHeight: 0,
//               transition: {
//                 ...spring,
//                 duration: theme.transitions.duration.enteringScreen,
//               },
//             }}
//           >
//             {row.cells.map(cell => {
//               return (
//                 <TableCell
//                   {...cell.getCellProps()}
//                   {...(cell.column.id === 'name'
//                     ? { component: 'th', scope: 'row' }
//                     : { align: 'right' })}
//                 >
//                   {cell.render('Cell')}
//                 </TableCell>
//               )
//             })}
//           </MotionRow>
//         )
//       })}
//     </AnimatePresence>
//   )
// }
