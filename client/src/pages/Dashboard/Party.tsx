import React from 'react'
import { useParams, useLocation, Navigate, useNavigate } from 'react-router-dom'
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useQueryClient,
} from 'react-query'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useMotionTemplate,
  MotionProps,
  PanInfo,
} from 'framer-motion'
import Box, { BoxProps } from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Hidden from '@mui/material/Hidden'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { IconButtonProps } from '@mui/material/IconButton'
import List from '@mui/material/List'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SvgIcon from '@mui/material/SvgIcon'
import { ReactComponent as BlockIcon } from '../../assets/icons/block_icon.svg'
import { ReactComponent as DislikeIcon } from '../../assets/icons/dislike_icon.svg'
import { ReactComponent as FavoriteIcon } from '../../assets/icons/favorite_icon.svg'
import { ReactComponent as LikeIcon } from '../../assets/icons/like_icon.svg'
import { ReactComponent as SuperlikeIcon } from '../../assets/icons/superlike_icon.svg'
import { ReactComponent as UndoIcon } from '../../assets/icons/undo_icon.svg'

import { usersService } from '../../services'
import {
  useUser,
  useParties,
  Party,
  PopulatedParty,
  YelpResponse,
  YelpBusiness,
  Business,
} from '../../context/FirestoreContext'
import { useProfile } from '../../context/ProfileViewContext'
import { usePopper, useOnDocumentSnapshot } from '../../hooks'
import { BusinessListItem, PartySettingsDrawer } from '../../components'
import { IconButton, Avatar, DividerText, Stars } from '../../common/components'

const images = [
  'https://media.istockphoto.com/photos/table-top-view-of-spicy-food-picture-id1316145932?b=1&k=20&m=1316145932&s=170667a&w=0&h=feyrNSTglzksHoEDSsnrG47UoY_XX4PtayUPpSMunQI=',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8Zm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8Zm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Zm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8N3x8Zm9vZHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=600&q=60',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fGZvb2R8ZW58MHx8MHx8&auto=format&fit=crop&w=600&q=60',
]

const PartyOptionsPopper = ({
  isAdmin,
  handleOpen,
}: {
  isAdmin: boolean
  handleOpen: () => void
}) => {
  const popper = usePopper()
  return (
    <>
      <IconButton
        id='manage-party-button'
        aria-controls={popper.open ? 'party-popper-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={popper.open ? 'true' : undefined}
        onClick={popper.handlePopperToggle}
        aria-label='settings'
        sx={{ mb: 1.5 }}
      >
        <MoreVertIcon />
      </IconButton>
      <Popper {...popper.getPopperProps()}>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            <MenuItem dense sx={{ display: { lg: 'none' } }}>
              History
            </MenuItem>
            {isAdmin ? (
              <MenuItem
                dense
                onClick={() => {
                  popper.handlePopperClose()
                  handleOpen()
                }}
              >
                Edit
              </MenuItem>
            ) : (
              <MenuItem
                dense
                sx={{ color: t => t.palette.error.main }}
                onClick={() => {
                  popper.handlePopperClose()
                  handleOpen()
                }}
              >
                Leave
              </MenuItem>
            )}
          </MenuList>
        </ClickAwayListener>
      </Popper>
    </>
  )
}

type SwipeButtonProps = IconButtonProps & {
  Icon: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined
    }
  >
  width?: number
}

const SwipeButton: React.FC<SwipeButtonProps> = ({
  width = 40,
  Icon,
  sx = [],
  style,
  ...props
}) => {
  return (
    <IconButton
      sx={[
        theme => ({
          p: 0,
          boxShadow: theme.shadows[3],
          height: width,
          width: width,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <SvgIcon
        component={Icon}
        style={{
          height: 'inherit',
          width: 'inherit',
          ...style,
        }}
      />
    </IconButton>
  )
}

type MatchByDate = { date: string; matches: (Business | undefined)[] }

const Matches = ({ partyId }: { partyId: string }) => {
  const { data, isLoading } = useQuery<MatchByDate[]>(
    'matches',
    async () => {
      const data = (await usersService.getMatches(partyId)) || {}
      const matchesBydate = Object.keys(data)
        .map(k => data[k])
        .reduce<{ [dateString: string]: Business[] }>((acc, curr) => {
          const dateString = curr.createdAt.toDate().toDateString()
          if (!acc[dateString]) {
            acc[dateString] = []
          }

          acc[dateString].push(curr)
          return acc
        }, {})

      return Object.keys(data)
        .map(k => data[k])
        .sort((a, b) => {
          if (a!.name < b!.name) {
            return -1
          }
          if (a!.name > b!.name) {
            return 1
          }
          return 0
        })
        .reduce<MatchByDate[]>((acc, curr) => {
          const dateString = curr.createdAt.toDate().toDateString()
          if (matchesBydate[dateString]) {
            acc.push({
              date: dateString,
              matches: matchesBydate[dateString],
            })
            delete matchesBydate[dateString]
          }
          return acc
        }, [])
    },
    {
      placeholderData: Array(1).fill({ matches: Array(6).fill(undefined) }),
      keepPreviousData: true,
    }
  )

  return (
    <Paper
      sx={{
        height: '100%',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant='h6' mb={2}>
        Matches
      </Typography>
      <Box sx={{ ...(isLoading && { overflowY: 'auto' }) }}>
        {data!.map(({ date, matches }, index) => (
          <Box key={index}>
            <DividerText text={date} />
            <List>
              {matches.map((match, index) => (
                <BusinessListItem
                  key={match?.id || index}
                  business={match}
                  secondaryAction={
                    <SwipeButton
                      Icon={FavoriteIcon}
                      sx={{
                        height: 24,
                        width: 24,
                        mr: 2,
                        '& svg': { color: 'white' },
                      }}
                    />
                  }
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

const Motion = motion(
  React.forwardRef<HTMLDivElement, React.PropsWithChildren<MotionProps>>(
    (props, ref) => {
      return (
        <div
          ref={ref}
          style={{ position: 'absolute', inset: 0 }}
          children={props.children}
        />
      )
    }
  ),
  { forwardMotionProps: true }
)

const Frame = motion(
  React.forwardRef<HTMLDivElement, React.PropsWithChildren<MotionProps>>(
    (props, ref) => (
      <Box
        ref={ref}
        height='100%'
        maxHeight={600}
        position='relative'
        display='flex'
        justifyContent='center'
        alignItems='center'
        children={props.children}
      />
    )
  ),
  { forwardMotionProps: true }
)

type CardProps = MotionProps & {
  business: YelpBusiness
}

const Card: React.FC<CardProps> = ({
  business,
  style,
  onDirectionLock,
  onDragStart,
  onDragEnd,
  animate,
}) => (
  <Motion
    drag
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    dragDirectionLock
    onDirectionLock={onDirectionLock}
    onDragEnd={onDragEnd}
    animate={animate}
    style={{ ...style }}
    transition={{ ease: [0.6, 0.05, -0.01, 0.9] }}
    whileTap={{ scale: 0.85 }}
  >
    <Paper
      sx={theme => ({
        width: '100%',
        height: '100%',
        backgroundImage: `url(${business.image_url})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
      })}
    >
      <Box p={2}>
        <Link
          href={business.url}
          target='_blank'
          display='flex'
          justifyContent='center'
          alignItems='center'
          ml='auto'
          height={40}
          width={40}
          borderRadius='50%'
          sx={theme => ({
            background: theme.palette.primary.main,
            color: theme.palette.background.paper,
          })}
        >
          <OpenInNewIcon />
        </Link>
      </Box>
      <Box py={2} px={4} sx={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
        <Grid container>
          <Grid item xs>
            <Box display='flex' alignItems='center'>
              <Typography variant='h6' mr={2}>
                {business.name}
              </Typography>
              <Box display='flex'>
                <Chip
                  label={business.price}
                  size='small'
                  color='primary'
                  variant='filled'
                  sx={{ width: 60, mr: 1 }}
                />
              </Box>
            </Box>
            <Typography variant='body2'>
              {business.location.city}, {business.location.country}
            </Typography>
            <Typography variant='body1' color='primary'>
              {business.categories.map(({ title }) => title).join(', ')}
            </Typography>
          </Grid>
          <Grid item xs='auto'>
            <Stars rating={business.rating} />
            <Typography variant='caption'>
              {business.review_count} Reviews
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  </Motion>
)

const useGetBusinesses = (
  params: Partial<Party['settings']>,
  options: UseInfiniteQueryOptions<YelpResponse>
) => {
  return useInfiniteQuery<YelpResponse>(
    ['cards'],
    async ({ pageParam = 0 }) => {
      return usersService.getYelpBusinesses({
        ...params,
        offset: pageParam,
      })
    },
    {
      cacheTime: 24 * 60 * 60 * 1000,
      getNextPageParam: (lastPage, pages) => lastPage.total > pages.length * 20,
      ...options,
    }
  )
}

type InfiniteCardsProps = {
  options: Partial<Party['settings']>
}

const InfiniteCards: React.FC<InfiniteCardsProps> = ({ options }) => {
  const queryClient = useQueryClient()

  const [allCards, setAllCards] = React.useState<YelpBusiness[]>(() => {
    const data = queryClient.getQueryData<{ pages: YelpResponse[][] }>('cards')
    if (!data) {
      return []
    }

    return data.pages
      .flat()
      .map(({ businesses }) => businesses)
      .flat()
  })

  const [cards, setCards] = React.useState<YelpBusiness[]>(() => {
    const data = allCards.slice(0, 3)
    setAllCards(prev => prev.slice(3))
    return data
  })

  const businesses = useGetBusinesses(options, {
    onSuccess(businesses) {
      const pages = businesses.pages
      if (pages && pages.length > 0) {
        const lastPage = pages[pages.length - 1]
        setAllCards(prev => [...prev, ...lastPage.businesses])
      }
    },
  })

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = businesses

  React.useEffect(() => {
    const max = 3
    if (allCards.length > 0 && cards.length < max) {
      const newCards = allCards.slice(0, max)
      newCards.forEach(business => {
        const image = new Image()
        image.src = business.image_url
      })

      setCards(prev => [...newCards, ...prev])
      setAllCards(prev => prev.slice(max))
    }
  }, [allCards, cards])

  React.useEffect(() => {
    const pageNum = data ? data.pages.length : 0
    if (allCards.length < 20 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage({
        pageParam: pageNum * 20,
      })
    }
  }, [allCards, hasNextPage, isFetchingNextPage])

  const [dragStart, setDragStart] = React.useState<{
    axis: 'x' | 'y' | null
    animation: {
      x: number
      y: number
    }
  }>({
    axis: null,
    animation: { x: 0, y: 0 },
  })

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const scale = useTransform(
    dragStart.axis === 'x' ? x : y,
    [-800, 0, 800],
    [1, 0.5, 1]
  )

  const shadowBlur = useTransform(
    dragStart.axis === 'x' ? x : y,
    [-800, 0, 800],
    [0, 25, 0]
  )

  const shadowOpacity = useTransform(
    dragStart.axis === 'x' ? x : y,
    [-800, 0, 800],
    [0, 0.2, 0]
  )

  const boxShadow = useMotionTemplate`0 ${shadowBlur}px 25px -5px rgba(0, 0, 0, ${shadowOpacity})`

  const onDirectionLock = (axis: 'x' | 'y' | null) =>
    setDragStart({ ...dragStart, axis })

  const animateCardSwipe = (animation: { x: number; y: number }) => {
    setDragStart({ ...dragStart, animation })

    setTimeout(() => {
      setDragStart({ axis: null, animation: { x: 0, y: 0 } })

      x.set(0)
      y.set(0)

      setCards([...cards.slice(0, cards.length - 1)])
    }, 200)
  }

  const onDragEnd = (info: any) => {
    if (dragStart.axis === 'x') {
      if (info.offset.x >= 300) animateCardSwipe({ x: 800, y: 0 })
      else if (info.offset.x <= -300) animateCardSwipe({ x: -800, y: 0 })
    } else {
      if (info.offset.y >= 300) animateCardSwipe({ x: 0, y: 800 })
      else if (info.offset.y <= -300) animateCardSwipe({ x: 0, y: -800 })
    }
  }

  const renderCards = () => {
    return cards.map((business, index) =>
      index === cards.length - 1 ? (
        <Card
          key={business.id || index}
          business={business}
          style={{ x, y, zIndex: index }}
          onDirectionLock={axis => onDirectionLock(axis)}
          onDragEnd={(e, info) => onDragEnd(info)}
          animate={dragStart.animation}
        />
      ) : (
        <Card
          key={business.id || index}
          business={business}
          style={{
            scale,
            boxShadow,
            zIndex: index,
          }}
        />
      )
    )
  }

  return (
    <Box
      height='100%'
      maxHeight={600}
      position='relative'
      display='flex'
      justifyContent='center'
      alignItems='center'
      overflow='hidden'
      p={3}
    >
      {renderCards()}
    </Box>
  )
}

const PartyView = () => {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useUser()
  const parties = useParties()
  const { viewProfile } = useProfile()

  const [party, setParty] = React.useState<PopulatedParty | undefined>(() => {
    if (!partyId || !parties[partyId]) return undefined
    const locationState = (location.state as { party?: PopulatedParty }) || {}
    return locationState.party ? locationState.party : undefined
  })

  React.useEffect(() => {
    if (!party) {
      return
    }

    navigate(`/party/${party.id}`, {
      state: { party },
      replace: true,
    })
  }, [party])

  React.useEffect(() => {
    if (!party) {
      return
    }

    const partyRef = usersService.docs.party(party.id).ref
    usersService.onDocumentSnapshot(
      partyRef,
      snapshot => {
        const data = snapshot.data()
        if (data) {
          setParty(prevParty => ({
            ...data,
            members: prevParty!.members,
          }))
        }
      },
      error => {
        console.log(error)
      }
    )
  }, [])

  const onUpdatePartySettings = React.useCallback(
    (updatedParty: PopulatedParty) => {
      setParty(updatedParty)
    },
    []
  )

  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!party) {
    return <Navigate to='/dashboard' replace />
  }

  // useOnDocumentSnapshot({
  //   ref: party ? usersService.docs.likes(partyId).ref : undefined,
  //   next: async snapshot => {
  //     const data = snapshot.data()
  //     if (data) {
  //     }
  //   },
  // })

  return (
    <Grid container columnSpacing={4} height='100%'>
      <Grid item xs={12} lg={8} height='100%'>
        <Box height='100%'>
          <Paper
            sx={{
              p: 4,
              height: 'calc(100% - 100px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box display='flex' justifyContent='space-between'>
              <Typography variant='h6' gutterBottom>
                {party!.name}
              </Typography>
              <PartyOptionsPopper
                isAdmin={user.uid === party?.admin}
                handleOpen={handleOpen}
              />
              <PartySettingsDrawer
                open={open}
                handleClose={handleClose}
                options={party!}
                onSuccess={onUpdatePartySettings}
              />
            </Box>
            <Stack
              direction='row'
              spacing={1}
              mb={2}
              sx={{
                height: 60,
                overflowY: 'hidden',
              }}
            >
              {party!.members.map(
                member =>
                  user.uid !== member.uid && (
                    <IconButton
                      key={member.uid}
                      sx={{ p: 0 }}
                      onClick={() => viewProfile(member)}
                    >
                      <Avatar
                        alt={member.name}
                        src={member.photoURL}
                        id={member.uid}
                        sx={theme => ({
                          '&::after': {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderStyle: 'solid',
                            borderWidth: 2,
                            borderColor: theme.palette.primary.main,
                            borderRadius: '50%',
                            content: '""',
                          },
                        })}
                      />
                    </IconButton>
                  )
              )}
            </Stack>
            <InfiniteCards options={party!.settings} />
          </Paper>
          <Box
            height={100}
            display='flex'
            justifyContent='center'
            alignItems='center'
          >
            <Stack
              height='100%'
              direction='row'
              spacing={2}
              alignItems='center'
            >
              <SwipeButton Icon={UndoIcon} width={35} />
              <SwipeButton Icon={BlockIcon} width={52} />
              <SwipeButton Icon={DislikeIcon} width={52} />
              <SwipeButton Icon={SuperlikeIcon} width={65} />
              <SwipeButton Icon={LikeIcon} width={52} />
              <SwipeButton
                Icon={FavoriteIcon}
                width={52}
                sx={{ '& svg': { color: 'white' } }}
              />
            </Stack>
          </Box>
        </Box>
      </Grid>
      <Hidden lgDown>
        <Grid item xs={12} lg height='100%'>
          <Matches partyId={partyId!} />
        </Grid>
      </Hidden>
    </Grid>
  )
}

export default PartyView
