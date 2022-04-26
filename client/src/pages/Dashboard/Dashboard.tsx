import React from 'react'
import { QuerySnapshot } from 'firebase/firestore'
import {
  useQuery,
  useMutation,
  useQueryClient,
  useIsMutating,
} from 'react-query'
import { DateTime } from 'luxon'
import { useTable, useSortBy, Column, CellProps } from 'react-table'
import { alpha } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardActionArea from '@mui/material/CardActionArea'
import List from '@mui/material/List'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Toolbar from '@mui/material/Toolbar'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import DeleteIcon from '@mui/icons-material/Delete'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'

import { usersService } from '../../services'
import { usePopper } from '../../hooks'
import {
  useUser,
  useParties,
  User,
  Party,
  PopulatedParty,
  Business,
  Businesses,
} from '../../context/FirestoreContext'
import { BusinessListItem, PartySettingsDrawer } from '../../components'
import {
  Button,
  ButtonLink,
  Link,
  Avatar,
  AvatarGroup,
  Stars,
} from '../../common/components'

interface TableToolbarProps {
  handleOpen: () => void
}

const TableToolbar: React.FC<TableToolbarProps> = ({ handleOpen }) => {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
      }}
    >
      <Typography
        sx={{ flex: '1 1 100%' }}
        variant='h6'
        id='tableTitle'
        component='div'
      >
        Parties
      </Typography>
      <IconButton
        color='primary'
        size='small'
        sx={theme => ({
          background: theme.palette.primary.main,
          color: theme.palette.background.paper,
        })}
        onClick={handleOpen}
      >
        <AddIcon />
      </IconButton>
    </Toolbar>
  )
}

const useDeleteParty = (party?: PopulatedParty) => {
  const queryClient = useQueryClient()
  return useMutation<void, unknown, PopulatedParty>(
    async newParty => usersService.deleteParty(newParty.id),
    {
      mutationKey: ['parties', party?.id],
      async onMutate(newParty) {
        await queryClient.cancelQueries('parties')

        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            return oldParties!.filter(({ id }) => id !== newParty.id)
          }
        )
      },
      onError(data, oldParty) {
        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            return [...oldParties!, oldParty]
          }
        )
      },
    }
  )
}

const PartyPopper = ({ party }: { party?: PopulatedParty }) => {
  const popper = usePopper()
  const deleteParty = useDeleteParty(party)
  const isMutating = useIsMutating(['parties', party?.id]) > 0

  const handleDeleteParty = () => {
    if (party) {
      deleteParty.mutate(party!)
    }
  }

  return (
    <>
      <IconButton
        id='manage-party-button'
        aria-controls={popper.open ? 'party-popper-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={popper.open ? 'true' : undefined}
        onClick={popper.handlePopperToggle}
        aria-label='settings'
        disabled={!party || isMutating}
      >
        <MoreVertIcon fontSize='small' />
      </IconButton>
      <Popper {...popper.getPopperProps()}>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            <MenuItem dense disabled={isMutating}>
              Edit
            </MenuItem>
            <MenuItem
              dense
              sx={{ color: t => t.palette.error.main }}
              onClick={handleDeleteParty}
              disabled={isMutating}
            >
              Delete
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

type PartyCardProps = {
  party?: PopulatedParty
}

const PartyCard: React.FC<PartyCardProps> = props => {
  const { party } = props

  const withLink = (content: JSX.Element) => {
    if (!party) {
      return content
    }

    return (
      <Link to={`/party/${party?.id}`} display='block' state={{ party }}>
        {content}
      </Link>
    )
  }

  const admin = React.useMemo(() => {
    return party?.members.find(({ uid }) => uid === party.admin)
  }, [party])

  const content = (
    <>
      <CardHeader
        action={party && <PartyPopper party={party} />}
        disableTypography
        sx={{ p: 0, mb: 1 }}
        title={
          <Box display='flex' alignItems='center' mb={1}>
            <Avatar
              {...(party && { alt: admin?.name, src: admin?.photoURL })}
              size='small'
              sx={{ mr: 1 }}
            />
            <Typography component='span' variant='body2'>
              {!party ? <Skeleton width={80} /> : admin?.username}
            </Typography>
          </Box>
        }
        subheader={
          <Typography component='span' variant='body1' fontWeight={600} noWrap>
            {!party ? <Skeleton width='75%' /> : party.name}
          </Typography>
        }
      />
      <Stack spacing={0.5}>
        <AvatarGroup
          total={!party ? 3 : party.members.length}
          users={party?.members}
        />
        <Typography
          variant='caption'
          overflow='hidden'
          textOverflow='ellipsis'
          whiteSpace='nowrap'
        >
          {!party ? (
            <Skeleton width='90%' />
          ) : (
            'Ana, Bryan, George, and 21 others'
          )}
        </Typography>
      </Stack>
    </>
  )

  return <Card sx={{ p: 2 }}>{withLink(content)}</Card>
}

interface PartiesTableProps {
  data: PopulatedParty[]
  columns: Column<PopulatedParty>[]
  handleOpen: () => void
}

const PartiesTable: React.FC<PartiesTableProps> = props => {
  const { data, columns } = props

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          sortBy: [
            {
              id: 'lastActive',
              desc: true,
            },
          ],
        },
        disableSortRemove: true,
      },
      useSortBy
    )

  return (
    <Paper
      sx={{
        height: '100%',
        p: 2,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableToolbar handleOpen={props.handleOpen} />
      {data.length > 0 ? (
        <TableContainer>
          <Table aria-labelledby='tableTitle' {...getTableProps()}>
            <TableHead>
              {headerGroups.map(headerGroup => (
                <TableRow {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <TableCell
                      align={column.id === 'name' ? 'left' : 'right'}
                      sortDirection={
                        column.isSorted
                          ? column.isSortedDesc
                            ? 'desc'
                            : 'asc'
                          : false
                      }
                      {...column.getHeaderProps()}
                    >
                      {column.id !== 'menu' && (
                        <TableSortLabel
                          active={column.isSorted}
                          direction={column.isSortedDesc ? 'desc' : 'asc'}
                          disabled={column.disableSortBy}
                          {...column.getSortByToggleProps()}
                        >
                          {column.render('Header')}
                          {column.isSorted ? (
                            <Box component='span' sx={visuallyHidden}>
                              {column.isSortedDesc
                                ? 'sorted descending'
                                : 'sorted ascending'}
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
                  <TableRow hover {...row.getRowProps()}>
                    {row.cells.map(cell => {
                      return (
                        <TableCell
                          {...(cell.column.id === 'name'
                            ? { component: 'th', scope: 'row' }
                            : { align: 'right' })}
                          {...cell.getCellProps()}
                        >
                          {cell.render('Cell')}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box py={10}>
          <Typography variant='caption' display='block' align='center'>
            No items to display.
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
  loading?: boolean
}

const TabPanel: React.FC<TabPanelProps> = props => {
  const { children, value, index, loading, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: '100%', overflow: loading ? 'hidden' : 'auto' }}
      {...other}
    >
      {value === index && children}
    </div>
  )
}

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
})

const BusinessLists = ({ user }: { user: User }) => {
  const [value, setValue] = React.useState(0)
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  const businesses = useQuery<{ saved: Business[]; blocked: Business[] }>(
    'businesses',
    async () => {
      const data = await usersService.getBusinesses(user.uid)
      const list = data ? Object.keys(data).map(k => data[k]) : []
      return {
        saved: list.filter(business => business.type === 'saved'),
        blocked: list.filter(business => business.type === 'blocked'),
      }
    },
    {
      initialData: {
        saved: [],
        blocked: [],
      },
    }
  )

  const BusinessList = ({ list }: { list: Business[] }) => {
    if (!businesses.isLoading && list.length === 0) {
      return (
        <Box py={5}>
          <Typography variant='caption' display='block' align='center'>
            No items to display.
          </Typography>
        </Box>
      )
    }

    return (
      <List>
        {list.map(business => (
          <BusinessListItem
            key={business.id}
            business={business}
            secondaryAction={
              <IconButton>
                <DeleteIcon />
              </IconButton>
            }
          />
        ))}
      </List>
    )
  }

  return (
    <Paper
      sx={{
        height: '100%',
        p: 2,
        mb: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        sx={{ py: 1.5, px: 1 }}
        variant='h6'
        id='tableTitle'
        component='div'
      >
        Businesses
      </Typography>
      <Box>
        <Tabs value={value} onChange={handleChange} aria-label='Your parties'>
          <Tab label='Favorites' {...a11yProps(0)} />
          <Tab label='Blocked' {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0} loading={businesses.isLoading}>
        <BusinessList list={businesses.data!.saved} />
      </TabPanel>
      <TabPanel value={value} index={1} loading={businesses.isLoading}>
        <BusinessList list={businesses.data!.blocked} />
      </TabPanel>
    </Paper>
  )
}

const useGetParties = (id: string) => {
  return useQuery<PopulatedParty[]>(
    'parties',
    async () => {
      const parties = await usersService.getParties(id)
      const partiesWithMembers = []
      for (const party of parties) {
        const members = await usersService.getUsers(party.members)
        partiesWithMembers.push({
          ...party,
          members: members.docs.map(member => member.data()),
        })
      }
      console.log(partiesWithMembers)
      return partiesWithMembers
    },
    {
      placeholderData: [...Array(3).fill(undefined), ...Array(5).fill({})],
      keepPreviousData: true,
      cacheTime: 60 * 1000,
    }
  )
}

const Dashboard = () => {
  const user = useUser()
  const { data, isLoading, isPlaceholderData } = useGetParties(user.uid)
  console.log(data, isLoading)
  const parties = React.useMemo(() => {
    let table = [...data!]

    if (!isPlaceholderData) {
      table = table.sort((a, b) => {
        const time1 = a.lastActive.toDate().getTime()
        const time2 = b.lastActive.toDate().getTime()
        return time2 - time1
      })
    }

    const cards = table.splice(0, 3)
    return {
      cards,
      table,
    }
  }, [data])

  const columns = React.useMemo(() => {
    let cols: Column<PopulatedParty>[] = [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value, row }) => {
          return (
            <Box display='flex' alignItems='center'>
              <AvatarGroup size='small' users={row.original.members} />
              <Link
                to={`/party/${row.original.id}`}
                underline='hover'
                state={{ party: row.original }}
              >
                {value}
              </Link>
            </Box>
          )
        },
      },
      {
        Header: 'Role',
        accessor: 'admin',
        Cell: ({ value }) => (
          <Chip
            label={value === user.uid ? 'Admin' : 'Member'}
            size='small'
            variant='outlined'
          />
        ),
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
        accessor: row => row.lastActive.toDate().getTime(),
        sortType: 'number',
        Cell: ({ value }: { value: number }) =>
          DateTime.now()
            .minus(new Date().getTime() - value)
            .toRelative(),
      },
      {
        id: 'menu',
        Cell: ({ row }: CellProps<PopulatedParty, boolean>) => (
          <PartyPopper party={row.original} />
        ),
      },
    ]

    if (isPlaceholderData) {
      cols = cols.map(({ id, accessor, ...col }, index) => ({
        ...col,
        id: index.toString(),
        disableSortBy: true,
        Cell: <Skeleton />,
      }))
    }

    return cols
  }, [isPlaceholderData])

  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <PartySettingsDrawer open={open} handleClose={handleClose} />
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' gutterBottom>
          Recent Parties
        </Typography>
        <Grid
          container
          columnSpacing={{ xs: 2, sm: 5 }}
          rowSpacing={{ xs: 2, sm: 5 }}
        >
          <Grid item xs={6} lg={3}>
            <Card>
              <CardActionArea onClick={handleOpen} sx={{ p: 2 }}>
                <CardHeader
                  disableTypography
                  sx={{ p: 0, mb: 1 }}
                  title={
                    <Box display='flex' alignItems='center' mb={1}>
                      <Avatar
                        alt='Create party icon'
                        size='small'
                        sx={theme => ({
                          background: theme.palette.primary.main,
                          mr: 1,
                        })}
                      >
                        <AddIcon />
                      </Avatar>
                      <Typography component='span' variant='body2'>
                        New
                      </Typography>
                    </Box>
                  }
                  subheader={
                    <Typography
                      component='span'
                      variant='body1'
                      fontWeight={600}
                    >
                      Create Party
                    </Typography>
                  }
                />
                <Stack spacing={0.5}>
                  <AvatarGroup total={0} disablePopover />
                  <Typography
                    variant='caption'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    whiteSpace='nowrap'
                  >
                    Invite friends to start swiping!
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
          {parties.cards.map((party, index) => (
            <Grid key={!party ? index : party.id} item xs={6} lg={3}>
              <PartyCard party={party} />
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Box
        display='flex'
        p={1}
        m={-1}
        sx={{ overflow: { lg: 'hidden' }, height: { lg: '100%' } }}
      >
        <Grid container rowSpacing={4} columnSpacing={4}>
          <Grid item xs={12} lg={8} height={{ xs: 'auto', lg: '100%' }}>
            <PartiesTable
              data={parties.table}
              columns={columns}
              handleOpen={handleOpen}
            />
          </Grid>
          <Grid item xs={12} lg={4} height={{ xs: 'auto', lg: '100%' }}>
            <BusinessLists user={user} />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default Dashboard

// const PartyCar: React.FC<PartyCardProps> = props => {
//   const { party } = props

//   return (
//     <Card sx={{ p: 2 }}>
//       <Link to={`/party/${party?.id}`} display='block'>
//         <CardHeader
//           action={<PartyPopper party={party} />}
//           disableTypography
//           sx={{ p: 0, mb: 1 }}
//           title={
//             <Box display='flex' alignItems='center' mb={1}>
//               <Avatar alt='John Doe' size='small' sx={{ mr: 1 }} />
//               <Typography component='span' variant='body2'>
//                 {party.members.find(({ uid }) => uid === party.admin)?.username}
//               </Typography>
//             </Box>
//           }
//           subheader={
//             <Typography
//               component='span'
//               variant='body1'
//               fontWeight={600}
//               noWrap
//             >
//               {party.name}
//             </Typography>
//           }
//         />
//         <Stack spacing={0.5}>
//           <AvatarGroup users={party?.members} />
//           <Typography
//             variant='caption'
//             overflow='hidden'
//             textOverflow='ellipsis'
//             whiteSpace='nowrap'
//           >
//             Ana, Bryan, George, and 21 others
//           </Typography>
//         </Stack>
//       </Link>
//     </Card>
//   )
// }

// const randomDate = (start: Date, end: Date) => {
//   return new Date(
//     start.getTime() + Math.random() * (end.getTime() - start.getTime())
//   )
// }

// const randomTimestamp = () =>
//   randomDate(new Date(2022, 0, 1), new Date()).getTime()
