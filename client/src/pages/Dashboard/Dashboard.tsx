import React from 'react'
import { useOutletContext, Navigate } from 'react-router-dom'
import { useIsMutating } from 'react-query'
import { DateTime } from 'luxon'
import { useTable, useSortBy, Column, CellProps } from 'react-table'
import { visuallyHidden } from '@mui/utils'
import Box from '@mui/material/Box'
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

import {
  useUser,
  useParties,
  useBusinesses,
  PopulatedParty,
  Business,
} from '../../context/FirestoreContext'
import { usePartySettings } from '../../context/PartySettingsContext'
import { usePopper, useLeaveParty, useDeleteBusiness } from '../../hooks'
import { BusinessListItem } from '../../components'
import { Link, Avatar, AvatarGroup } from '../../common/components'

const TableToolbar: React.FC = () => {
  const { openSettings } = usePartySettings()

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
          ':hover': {
            background: theme.palette.primary.dark,
          },
        })}
        onClick={() => openSettings()}
      >
        <AddIcon />
      </IconButton>
    </Toolbar>
  )
}

const PartyPopper = ({ party }: { party?: PopulatedParty }) => {
  const popper = usePopper()
  const user = useUser()
  const leaveParty = useLeaveParty(party)
  const isMutating = useIsMutating(['parties', party?.id]) > 0
  const { openSettings } = usePartySettings()

  const handleLeaveParty = () => {
    if (party) {
      leaveParty.mutate(party!)
    }
  }

  return (
    <>
      <IconButton
        id='manage-party-button'
        aria-controls={popper.open ? 'party-popper-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={popper.open ? 'true' : undefined}
        onClick={e => {
          e.preventDefault()
          popper.handlePopperToggle(e)
        }}
        aria-label='settings'
        disabled={!party || isMutating}
      >
        <MoreVertIcon fontSize='small' />
      </IconButton>
      <Popper {...popper.getPopperProps()}>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            {user.uid === party?.admin && (
              <MenuItem
                dense
                onClick={e => {
                  e.preventDefault()
                  popper.handlePopperClose()
                  if (party) openSettings({ party })
                }}
                disabled={isMutating}
              >
                Edit
              </MenuItem>
            )}
            <MenuItem
              dense
              sx={{ color: t => t.palette.error.main }}
              onClick={e => {
                e.preventDefault()
                popper.handlePopperClose()
                handleLeaveParty()
              }}
              disabled={isMutating}
            >
              {user.uid === party?.admin ? 'Delete' : 'Leave'}
            </MenuItem>
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

type PartyCardProps = {
  party?: PopulatedParty
  isCreatePartyCard?: boolean
}

const PartyCard: React.FC<PartyCardProps> = props => {
  const { isCreatePartyCard, party } = props
  const { openSettings } = usePartySettings()

  const wrap = (content: JSX.Element) => {
    if (isCreatePartyCard) {
      return (
        <CardActionArea onClick={() => openSettings()} sx={{ p: 2 }}>
          {content}
        </CardActionArea>
      )
    }

    if (!party) {
      return content
    }

    return (
      <Link to={`/party/${party?.id}`} display='block' p={2} state={{ party }}>
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
              // {...(party && { alt: admin?.name, src: admin?.photoURL })}
              alt={isCreatePartyCard ? 'Create Party Icon' : admin?.name}
              {...(!isCreatePartyCard && { src: admin?.photoURL })}
              size='small'
              sx={theme => ({
                mr: 1,
                ...(isCreatePartyCard && {
                  background: theme.palette.primary.main,
                }),
              })}
              {...(isCreatePartyCard && { children: <AddIcon /> })}
            />
            <Typography component='span' variant='body2'>
              {isCreatePartyCard ? (
                'New'
              ) : !party ? (
                <Skeleton width={80} />
              ) : (
                admin?.username
              )}
            </Typography>
          </Box>
        }
        subheader={
          <Typography component='span' variant='body1' fontWeight={600} noWrap>
            {isCreatePartyCard ? (
              'Create Party'
            ) : !party ? (
              <Skeleton width='75%' />
            ) : (
              party?.name
            )}
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
          {isCreatePartyCard ? (
            'Invite friends and start swiping!'
          ) : !party ? (
            <Skeleton width='90%' />
          ) : (
            'Ana, Bryan, George, and 21 others'
          )}
        </Typography>
      </Stack>
    </>
  )

  return <Card>{wrap(content)}</Card>
}

interface PartiesTableProps {
  data: PopulatedParty[]
  columns: Column<PopulatedParty>[]
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
      <TableToolbar />
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
  isLoading?: boolean
}

const TabPanel: React.FC<TabPanelProps> = props => {
  const { children, value, index, isLoading, ...other } = props

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: '100%', overflow: isLoading ? 'hidden' : 'auto' }}
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

const BusinessLists = () => {
  const businesses = useBusinesses()
  const deleteBusiness = useDeleteBusiness()

  const handleDeleteBusiness = (business?: Business) => () => {
    if (business) {
      deleteBusiness.mutate(business)
    }
  }

  const saved = React.useMemo(() => {
    if (!businesses.data) {
      return Array(4).fill({})
    }

    return businesses.data.saved
  }, [businesses.data])

  const blocked = React.useMemo(() => {
    if (!businesses.data) {
      return Array(4).fill({})
    }

    return businesses.data.blocked
  }, [businesses.data])

  const [value, setValue] = React.useState(0)
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  const BusinessList = ({ list }: { list: Business[] }) => {
    if (!businesses.isPlaceholderData && list.length === 0) {
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
        {list.map((business, index) => (
          <BusinessListItem
            key={business?.id || index}
            details={business?.details}
            secondaryAction={
              <IconButton onClick={handleDeleteBusiness(business)}>
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
      <TabPanel value={value} index={0} isLoading={businesses.isLoading}>
        <BusinessList list={saved} />
      </TabPanel>
      <TabPanel value={value} index={1} isLoading={businesses.isLoading}>
        <BusinessList list={blocked} />
      </TabPanel>
    </Paper>
  )
}

const Dashboard = () => {
  const { data, isPlaceholderData } = useParties()

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
  }, [data, isPlaceholderData])

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
        Cell: ({ value }) => {
          const user = useUser()
          return (
            <Chip
              label={value === user.uid ? 'Admin' : 'Member'}
              size='small'
              variant='outlined'
            />
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

  return (
    <>
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
            <PartyCard isCreatePartyCard />
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
            <PartiesTable data={parties.table} columns={columns} />
          </Grid>
          <Grid item xs={12} lg={4} height={{ xs: 'auto', lg: '100%' }}>
            <BusinessLists />
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default Dashboard
