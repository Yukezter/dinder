import React from 'react'
import { query, orderBy } from 'firebase/firestore'
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
  useMotionTemplate,
  MotionProps,
} from 'framer-motion'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Grid from '@mui/material/Grid'
import Dialog, { DialogProps } from '@mui/material/Dialog'
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
  PopulatedParty,
  YelpResponse,
  YelpBusiness,
  Business,
  Swipes,
  SwipeAction,
  Match,
} from '../../context/FirestoreContext'
import { useProfile } from '../../context/ProfileViewContext'
import { usePartySettings } from '../../context/PartySettingsContext'
import { usePopper, useOnDocumentSnapshot } from '../../hooks'
import { BusinessListItem } from '../../components'
import { IconButton, Avatar, DividerText, Stars } from '../../common/components'

const PartyOptionsPopper = ({
  party,
  handleUpdatePartySettings,
}: {
  party: PopulatedParty
  handleUpdatePartySettings: (updatedParty: PopulatedParty) => void
}) => {
  const popper = usePopper()
  const user = useUser()
  const { openSettings } = usePartySettings()
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
            {user.uid === party?.admin ? (
              <MenuItem
                dense
                onClick={() => {
                  popper.handlePopperClose()
                  openSettings({
                    party,
                    onSuccess(data) {
                      handleUpdatePartySettings(data)
                    },
                  })
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

type MembersProps = {
  members: PopulatedParty['members']
}

const Members: React.FC<MembersProps> = props => {
  const { members } = props
  const user = useUser()
  const { viewProfile } = useProfile()

  return (
    <Stack
      direction='row'
      spacing={1}
      mb={2}
      sx={{
        height: 60,
        overflowY: 'hidden',
      }}
    >
      {members.map(
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

type MatchDialogProps = DialogProps & {
  match?: Match
}

// let matchQueue = []

const MatchDialog: React.FC<MatchDialogProps> = props => {
  const { match, ...dialogProps } = props

  return (
    <Dialog {...dialogProps}>
      <Paper sx={{ p: 5 }}>
        <Typography variant='h6' gutterBottom>
          {match?.business.name}
        </Typography>
        <Box display='flex'>
          <Box display='flex'>
            <Chip
              label={match?.business.price}
              size='small'
              color='primary'
              variant='filled'
              sx={{ width: 60, mr: 1 }}
            />
          </Box>
          <div>
            <Stars rating={match?.business.rating} />
            <Typography variant='caption'>
              {match?.business.reviews} Reviews
            </Typography>
          </div>
        </Box>
        <Typography variant='body2'>{match?.business.location}</Typography>
        <Typography variant='body1' color='primary'>
          {match?.business.categories}
        </Typography>
      </Paper>
    </Dialog>
  )
}

// const useGetMatches = (partyId: string) => {
//   return useQuery<MatchByDate[]>(
//     'matches',
//     async () => {
//       const data = (await usersService.getMatches(partyId)) || {}
//       const matchesBydate = Object.keys(data)
//         .map(k => data[k])
//         .reduce<{ [dateString: string]: Business[] }>((acc, curr) => {
//           const dateString = curr.createdAt.toDate().toDateString()
//           if (!acc[dateString]) {
//             acc[dateString] = []
//           }

//           acc[dateString].push(curr)
//           return acc
//         }, {})

//       return Object.keys(data)
//         .map(k => data[k])
//         .sort((a, b) => {
//           if (a!.name < b!.name) {
//             return -1
//           }
//           if (a!.name > b!.name) {
//             return 1
//           }
//           return 0
//         })
//         .reduce<MatchByDate[]>((acc, curr) => {
//           const dateString = curr.createdAt.toDate().toDateString()
//           if (matchesBydate[dateString]) {
//             acc.push({
//               date: dateString,
//               matches: matchesBydate[dateString],
//             })
//             delete matchesBydate[dateString]
//           }
//           return acc
//         }, [])
//     },
//     {
//       placeholderData: Array(1).fill({ matches: Array(6).fill(undefined) }),
//       keepPreviousData: true,
//     }
//   )
// }

const initalMatches = Array(1).fill({ matches: Array(6).fill(undefined) })

type MatchesByDate = { date: string; matches: Match[] }[]

const Matches = ({ partyId }: { partyId: string }) => {
  const user = useUser()
  const [matches, setMatches] = React.useState<MatchesByDate>(initalMatches)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [matchQueue, setMatchQueue] = React.useState<Match[]>([])

  const handleFadeEnd = React.useCallback(() => {
    setMatchQueue(prevMatchQueue => {
      const newMatchQueue = [...prevMatchQueue]
      newMatchQueue.shift()
      return newMatchQueue
    })
  }, [])

  const initialCall = React.useRef(true)

  React.useEffect(() => {
    if (!partyId) return

    setIsLoading(true)

    const matchesRef = usersService.collections.matches(partyId).ref
    const matchesQuery = query(matchesRef, orderBy('createdAt', 'desc'))
    const unsubscribe = usersService.onCollectionSnapshot(
      matchesQuery,
      snapshot => {
        const sortedMatches = snapshot.docs.reduce<MatchesByDate>(
          (dates, doc) => {
            if (doc.exists()) {
              const data = doc.data()
              const dateString = data.createdAt.toDate().toDateString()
              const dateIndex = dates.findIndex(
                match => match.date === dateString
              )
              if (dateIndex === -1) {
                dates.push({
                  date: dateString,
                  matches: [data],
                })
              } else {
                dates[dateIndex].matches.push(data)
              }
            }

            return dates
          },
          []
        )

        setMatches(sortedMatches)

        if (!initialCall.current) {
          snapshot.docChanges().forEach(change => {
            if (change.doc.exists() && change.type === 'added') {
              const data = change.doc.data()
              if (data.type === 'like' && data.last === user.uid) {
                setMatchQueue(prevMatchQueue => [...prevMatchQueue, data])
              }

              if (data.type === 'super-like') {
                setMatchQueue(prevMatchQueue => [...prevMatchQueue, data])
              }
            }
          })
        }

        initialCall.current = false
        setIsLoading(false)
      },
      error => {
        console.log(error)
      }
    )

    return unsubscribe
  }, [partyId, user.uid])

  console.log(matchQueue)

  React.useEffect(() => {
    if (!isOpen && matchQueue.length > 0) {
      setIsOpen(true)
    }
  }, [isOpen, matchQueue])

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    setMatchQueue(prevMatchQueue => {
      const newMatchQueue = [...prevMatchQueue]
      newMatchQueue.shift()
      return newMatchQueue
    })
  }, [])

  return (
    <Paper
      sx={{
        height: '100%',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MatchDialog
        open={isOpen && !!matchQueue[0]}
        match={matchQueue[0]}
        onClose={handleClose}
      />
      <Typography variant='h6' mb={2}>
        Matches
      </Typography>
      <Box sx={{ ...(!isLoading && { overflowY: 'auto' }) }}>
        {matches.map(({ date, matches }, index) => (
          <Box key={index}>
            <DividerText text={date} />
            <List>
              {matches.map((match, index) => (
                <BusinessListItem
                  key={match?.business.id || index}
                  business={match?.business}
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

const useGetYelpBusinesses = (
  params: PopulatedParty['params'] & PopulatedParty['location'],
  options: UseInfiniteQueryOptions<YelpResponse>
) => {
  return useInfiniteQuery<YelpResponse>(
    ['cards'],
    async ({ pageParam = 0 }) => {
      const data = await usersService.getYelpBusinesses({
        ...params,
        offset: pageParam,
      })

      data.businesses.forEach(business => {
        const image = new Image()
        image.src = business.image_url
      })

      return data
    },
    {
      // cacheTime: 24 * 60 * 60 * 1000,
      getNextPageParam: (lastPage, pages) => lastPage.total > pages.length * 20,
      ...options,
    }
  )
}

type ActionButtonsProps = {
  userId: string
  business?: YelpBusiness
  animateCardSwipe: (action: SwipeAction) => void
  isDisabled: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(props => {
  const { userId, business, animateCardSwipe, isDisabled } = props

  const businessMutation = useMutation<
    void,
    unknown,
    { type: 'save' | 'block'; business: YelpBusiness }
  >(data =>
    usersService.addBusiness(userId, {
      type: data.type,
      business: {
        id: data.business.id,
        image: data.business.image_url,
        name: data.business.name,
        price: data.business.price,
        rating: data.business.rating,
        categories: data.business.categories
          .map(({ title }) => title)
          .join(', '),
        reviews: data.business.review_count,
        location: `${data.business.location.city}, ${data.business.location.country}`,
        url: data.business.url,
      },
    })
  )

  const saveOrBlock = (type: 'save' | 'block') => {
    if (business) {
      businessMutation.mutate({
        type,
        business,
      })
    }
  }

  return (
    <Stack
      height={100}
      direction='row'
      spacing={2}
      justifyContent='center'
      alignItems='center'
      position='absolute'
      left={0}
      right={0}
      bottom={-134}
    >
      {/* <SwipeButton
        Icon={UndoIcon}
        width={35}
        onClick={() => swipe('undo')}
        disabled={isDisabled}
      /> */}
      <SwipeButton
        Icon={BlockIcon}
        width={52}
        onClick={() => saveOrBlock('block')}
        disabled={isDisabled}
      />
      <SwipeButton
        Icon={DislikeIcon}
        width={52}
        onClick={() => animateCardSwipe('dislike')}
        disabled={isDisabled}
      />
      <SwipeButton
        Icon={SuperlikeIcon}
        width={65}
        onClick={() => animateCardSwipe('super-like')}
        disabled={isDisabled}
      />
      <SwipeButton
        Icon={LikeIcon}
        width={52}
        onClick={() => animateCardSwipe('like')}
        disabled={isDisabled}
      />
      <SwipeButton
        Icon={FavoriteIcon}
        width={52}
        onClick={() => saveOrBlock('save')}
        disabled={isDisabled}
        sx={{ '& svg': { color: 'white' } }}
      />
    </Stack>
  )
})

type InfiniteCardsProps = {
  party: PopulatedParty
}

const InfiniteCards: React.FC<InfiniteCardsProps> = ({ party }) => {
  const queryClient = useQueryClient()
  const user = useUser()

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

  const businesses = useGetYelpBusinesses(
    {
      ...party.location,
      ...party.params,
    },
    {
      onSuccess(businesses) {
        const pages = businesses.pages
        if (pages && pages.length > 0) {
          const lastPage = pages[pages.length - 1]
          const newCards = lastPage.businesses

          if (pages.length === 1 && cards.length === 0) {
            setCards(newCards.splice(0, 3))
          }

          setAllCards(prev => [...prev, ...newCards])
        }
      },
    }
  )

  const swipeMutation = useMutation<
    void,
    unknown,
    { business: YelpBusiness; action: SwipeAction }
  >(async data =>
    usersService.swipe(party.id, data.business.id, user.uid, data.action)
  )

  const currentBusiness = React.useMemo<YelpBusiness | undefined>(
    () => cards[cards.length - 1],
    [cards]
  )

  const swipe = React.useCallback(
    (action: SwipeAction) => {
      if (currentBusiness) {
        swipeMutation.mutate({
          action,
          business: currentBusiness,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentBusiness]
  )

  const isDisabled = React.useMemo(
    () => !currentBusiness?.id || swipeMutation.isLoading,
    [currentBusiness?.id, swipeMutation.isLoading]
  )

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = businesses

  React.useEffect(() => {
    const pageNum = data ? data.pages.length : 0
    if (allCards.length < 20 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage({
        pageParam: pageNum * 20,
      })
    }
  }, [allCards, data, hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const onDirectionLock = React.useCallback(
    (axis: 'x' | 'y' | null) => setDragStart({ ...dragStart, axis }),
    [dragStart, setDragStart]
  )

  const animateCardSwipe = React.useCallback(
    (action: SwipeAction) => {
      swipe(action)

      if (action === 'like') {
        setDragStart({ ...dragStart, animation: { x: 800, y: 0 } })
      } else if (action === 'dislike') {
        setDragStart({ ...dragStart, animation: { x: -800, y: 0 } })
      } else if (action === 'super-like') {
        setDragStart({ ...dragStart, animation: { x: 0, y: -800 } })
      }

      setTimeout(() => {
        setDragStart({ axis: null, animation: { x: 0, y: 0 } })

        x.set(0)
        y.set(0)

        setCards([...allCards.slice(0, 1), ...cards.slice(0, cards.length - 1)])
        setAllCards(allCards.slice(1))
      }, 200)
    },
    [swipe, dragStart, x, y, allCards, cards]
  )

  const onDragEnd = React.useCallback(
    (info: any) => {
      if (dragStart.axis === 'x') {
        if (info.offset.x >= 300) animateCardSwipe('like')
        else if (info.offset.x <= -300) animateCardSwipe('dislike')
      } else {
        if (info.offset.y <= -300) animateCardSwipe('super-like')
      }
    },
    [dragStart, animateCardSwipe]
  )

  const renderCards = () => {
    return cards.map((business, index) =>
      index === cards.length - 1 ? (
        <Card
          key={business.id ? `${business.id}-${index}` : index}
          business={business}
          style={{ x, y, zIndex: index }}
          onDirectionLock={axis => onDirectionLock(axis)}
          onDragEnd={(e, info) => onDragEnd(info)}
          animate={dragStart.animation}
        />
      ) : (
        <Card
          key={business.id ? `${business.id}-${index}` : index}
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
    <div style={{ height: '100%', position: 'relative' }}>
      <Box
        height='100%'
        maxHeight={600}
        position='relative'
        display='flex'
        justifyContent='center'
        alignItems='center'
        overflow='hidden'
      >
        {businesses.isLoading ? (
          <Skeleton variant='rectangular' width='100%' height='100%' />
        ) : (
          renderCards()
        )}
      </Box>
      <ActionButtons
        userId={user.uid}
        business={currentBusiness}
        animateCardSwipe={animateCardSwipe}
        isDisabled={isDisabled}
      />
    </div>
  )
}

const PartyView = () => {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const parties = useParties()

  const [party, setParty] = React.useState<PopulatedParty | undefined>(() => {
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
  }, [party, navigate])

  React.useEffect(() => {
    if (!party?.id) {
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
  }, [party?.id])

  const handleUpdatePartySettings = React.useCallback(
    (updatedParty: PopulatedParty) => {
      setParty(updatedParty)
    },
    []
  )

  if (!partyId || !party || !parties[partyId]) {
    return <Navigate to='/dashboard' replace />
  }

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
                party={party!}
                handleUpdatePartySettings={handleUpdatePartySettings}
              />
            </Box>
            <Members members={party.members} />
            <InfiniteCards party={party!} />
          </Paper>
          <Box
            height={100}
            display='flex'
            justifyContent='center'
            alignItems='center'
          ></Box>
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

// React.useEffect(() => {
//   const swipesRef = usersService.collections.swipes(party.id).ref
//   const unsubscribe = usersService.onCollectionSnapshot(
//     swipesRef,
//     snapshot => {
//       console.log('snapshot', snapshot)
//       setSwipesMap(prevSwipesMap => {
//         const oldSwipesMap = { ...prevSwipesMap }
//         const newSwipesMap = snapshot.docs.reduce<{
//           [yelpId: string]: Swipes
//         }>((docs, doc) => {
//           const data = doc.data()
//           if (!data) {
//             delete oldSwipesMap[doc.id]
//             return docs
//           }

//           docs[doc.id] = data
//           return docs
//         }, {})

//         console.log('Swipes Map', newSwipesMap)

//         const swipes = swipesMap[business.id]
//       console.log(`Swipes for "${business.name} - ${business.id}"`, swipes)

//       if (swipes) {
//         if (action === 'like') {
//           const isLikeMatch = party.members.every(member => {
//             return (
//               member.uid === user.uid || swipes[member.uid]?.action === 'like'
//             )
//           })

//           if (isLikeMatch) {
//             console.log('Like match!')
//             const lastUserToMatch = Object.keys(swipes).reduce((a, b) =>
//               swipes[a].timestamp.nanoseconds > swipes[b].timestamp.nanoseconds
//                 ? a
//                 : b
//             )

//             setMatchQueue(prevMatchQueue => [
//               ...prevMatchQueue,
//               {
//                 type: 'like',
//                 business,
//               },
//             ])

//             if (user.uid === lastUserToMatch) {
//               console.log('You were the last user to match!')
//               setMatchQueue(prevMatchQueue => [
//                 ...prevMatchQueue,
//                 {
//                   type: 'like',
//                   business,
//                 },
//               ])
//             }
//           }
//         }

//         if (action === 'super-like') {
//           const isSuperLikeMatch = party.members.every(member => {
//             return (
//               member.uid === user.uid ||
//               swipes[member.uid]?.action === 'super-like'
//             )
//           })

//           if (isSuperLikeMatch) {
//             console.log('Super-like match!')
//             setMatchQueue(prevMatchQueue => [
//               ...prevMatchQueue,
//               {
//                 type: 'like',
//                 business,
//               },
//             ])
//           }
//         }
//       }

//         return {
//           ...oldSwipesMap,
//           ...newSwipesMap,
//         }
//       })
//     },
//     error => {
//       console.log(error)
//     }
//   )

//   return unsubscribe
// }, [party.id, user.uid])

// const max = 2

// type CardsState = {
//   all: YelpBusiness[]
//   current: YelpBusiness[]
// }

// type CardsProps = {
//   cards: YelpBusiness[]
//   onDirectionLock: (axis: 'x' | 'y' | null) => void
//   onDragEnd: (info: any) => void
//   x: MotionValue<number>
//   y: MotionValue<number>
//   dragStart: {
//     axis: 'x' | 'y' | null
//     animation: {
//       x: number
//       y: number
//     }
//   }
//   scale: MotionValue<number>
//   boxShadow: MotionValue<string>
// }

// const Cards = React.memo<CardsProps>(props => {
//   const {
//     cards,
//     x,
//     y,
//     onDirectionLock,
//     onDragEnd,
//     dragStart,
//     scale,
//     boxShadow,
//   } = props
//   return (
//     <Box
//       height='100%'
//       maxHeight={600}
//       position='relative'
//       display='flex'
//       justifyContent='center'
//       alignItems='center'
//       overflow='hidden'
//       p={3}
//     >
//       {cards.map((business, index) =>
//         index === cards.length - 1 ? (
//           <Card
//             key={business.id || index}
//             business={business}
//             style={{ x, y, zIndex: index }}
//             onDirectionLock={axis => onDirectionLock(axis)}
//             onDragEnd={(e, info) => onDragEnd(info)}
//             animate={dragStart.animation}
//           />
//         ) : (
//           <Card
//             key={business.id || index}
//             business={business}
//             style={{
//               scale,
//               boxShadow,
//               zIndex: index,
//             }}
//           />
//         )
//       )}
//     </Box>
//   )
// })

// type CardsState = {
//   all: YelpBusiness[]
//   current: YelpBusiness[]
// }

// type InfiniteCardsProps = {
//   options: Partial<Party['settings']>
// }

// const InfiniteCards: React.FC<InfiniteCardsProps> = ({ options }) => {
//   const queryClient = useQueryClient()

//   const [cardsState, setCardsState] = React.useState<CardsState>(() => {
//     const data = queryClient.getQueryData<{ pages: YelpResponse[][] }>('cards')
//     const state: CardsState = {
//       all: [],
//       current: [],
//     }

//     if (!data) {
//       return state
//     }

//     state.all = data.pages
//       .flat()
//       .map(({ businesses }) => businesses)
//       .flat()

//     state.current = state.all.splice(0, 3)

//     return state
//   })

//   const businesses = useGetBusinesses(options, {
//     onSuccess(businesses) {
//       const pages = businesses.pages
//       if (pages && pages.length > 0) {
//         const lastPage = pages[pages.length - 1]
//         setCardsState(prev => ({
//           ...prev,
//           all: [...prev.all, ...lastPage.businesses],
//         }))
//       }
//     },
//   })

//   const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = businesses

//   React.useEffect(() => {
//     const { all, current } = cardsState
//     const max = 3

//     if (all.length > 0 && current.length < max) {
//       setCardsState(prev => {
//         return {
//           all: prev.all.slice(max),
//           current: [...prev.all.slice(0, max), ...prev.current],
//         }
//       })
//     }
//   }, [cardsState])

//   React.useEffect(() => {
//     const pageNum = data ? data.pages.length : 0
//     if (cardsState.all.length < 20 && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage({
//         pageParam: pageNum * 20,
//       })
//     }
//   }, [cardsState.all, data, hasNextPage, isFetchingNextPage, fetchNextPage])

//   const [dragStart, setDragStart] = React.useState<{
//     axis: 'x' | 'y' | null
//     animation: {
//       x: number
//       y: number
//     }
//   }>({
//     axis: null,
//     animation: { x: 0, y: 0 },
//   })

//   const x = useMotionValue(0)
//   const y = useMotionValue(0)

//   const scale = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [1, 0.5, 1]
//   )

//   const shadowBlur = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [0, 25, 0]
//   )

//   const shadowOpacity = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [0, 0.2, 0]
//   )

//   const boxShadow = useMotionTemplate`0 ${shadowBlur}px 25px -5px rgba(0, 0, 0, ${shadowOpacity})`

//   const onDirectionLock = React.useCallback(
//     (axis: 'x' | 'y' | null) => setDragStart({ ...dragStart, axis }),
//     [dragStart, setDragStart]
//   )

//   const animateCardSwipe = React.useCallback(
//     (animation: { x: number; y: number }) => {
//       setDragStart({ ...dragStart, animation })

//       setTimeout(() => {
//         setDragStart({ axis: null, animation: { x: 0, y: 0 } })

//         x.set(0)
//         y.set(0)

//         setCardsState(prev => ({
//           ...prev,
//           current: [...prev.current.slice(0, prev.current.length - 1)],
//         }))
//       }, 200)
//     },
//     [dragStart, x, y]
//   )

//   const onDragEnd = React.useCallback(
//     (info: any) => {
//       if (dragStart.axis === 'x') {
//         if (info.offset.x >= 300) animateCardSwipe({ x: 800, y: 0 })
//         else if (info.offset.x <= -300) animateCardSwipe({ x: -800, y: 0 })
//       } else {
//         if (info.offset.y >= 300) animateCardSwipe({ x: 0, y: 800 })
//         else if (info.offset.y <= -300) animateCardSwipe({ x: 0, y: -800 })
//       }
//     },
//     [dragStart, animateCardSwipe]
//   )

//   return (
//     <Cards
//       cards={cardsState.current}
//       x={x}
//       y={y}
//       dragStart={dragStart}
//       onDirectionLock={onDirectionLock}
//       onDragEnd={onDragEnd}
//       scale={scale}
//       boxShadow={boxShadow}
//     />
//   )
// }

// const Cards = React.memo<{
//   cards: YelpBusiness[]
//   setCardsState: React.Dispatch<React.SetStateAction<CardsState>>
// }>(({ cards, setCardsState }) => {
//   const [dragStart, setDragStart] = React.useState<{
//     axis: 'x' | 'y' | null
//     animation: {
//       x: number
//       y: number
//     }
//   }>({
//     axis: null,
//     animation: { x: 0, y: 0 },
//   })

//   const x = useMotionValue(0)
//   const y = useMotionValue(0)

//   const scale = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [1, 0.5, 1]
//   )

//   const shadowBlur = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [0, 25, 0]
//   )

//   const shadowOpacity = useTransform(
//     dragStart.axis === 'x' ? x : y,
//     [-800, 0, 800],
//     [0, 0.2, 0]
//   )

//   const boxShadow = useMotionTemplate`0 ${shadowBlur}px 25px -5px rgba(0, 0, 0, ${shadowOpacity})`

//   const onDirectionLock = React.useCallback(
//     (axis: 'x' | 'y' | null) => setDragStart({ ...dragStart, axis }),
//     [dragStart, setDragStart]
//   )

//   const animateCardSwipe = React.useCallback(
//     (animation: { x: number; y: number }) => {
//       setDragStart({ ...dragStart, animation })

//       setTimeout(() => {
//         setDragStart({ axis: null, animation: { x: 0, y: 0 } })

//         x.set(0)
//         y.set(0)

//         setCardsState(prev => ({
//           ...prev,
//           current: [...prev.current.slice(0, prev.current.length - 1)],
//         }))
//       }, 200)
//     },
//     [dragStart, x, y, setCardsState]
//   )

//   const onDragEnd = React.useCallback(
//     (info: any) => {
//       if (dragStart.axis === 'x') {
//         if (info.offset.x >= 300) animateCardSwipe({ x: 800, y: 0 })
//         else if (info.offset.x <= -300) animateCardSwipe({ x: -800, y: 0 })
//       } else {
//         if (info.offset.y >= 300) animateCardSwipe({ x: 0, y: 800 })
//         else if (info.offset.y <= -300) animateCardSwipe({ x: 0, y: -800 })
//       }
//     },
//     [dragStart, animateCardSwipe]
//   )

//   const renderCards = () => {
//     return cards.map((business, index) =>
//       index === cards.length - 1 ? (
//         <Card
//           key={business.id || index}
//           business={business}
//           style={{ x, y, zIndex: index }}
//           onDirectionLock={axis => onDirectionLock(axis)}
//           onDragEnd={(e, info) => onDragEnd(info)}
//           animate={dragStart.animation}
//         />
//       ) : (
//         <Card
//           key={business.id || index}
//           business={business}
//           style={{
//             scale,
//             boxShadow,
//             zIndex: index,
//           }}
//         />
//       )
//     )
//   }

//   return (
//     <Box
//       height='100%'
//       maxHeight={600}
//       position='relative'
//       display='flex'
//       justifyContent='center'
//       alignItems='center'
//       overflow='hidden'
//       p={3}
//     >
//       {renderCards()}
//     </Box>
//   )
// })

// const InfiniteCards: React.FC<InfiniteCardsProps> = ({ options }) => {
//   const queryClient = useQueryClient()

//   const [cardsState, setCardsState] = React.useState<CardsState>(() => {
//     const data = queryClient.getQueryData<{ pages: YelpResponse[][] }>('cards')
//     const state: CardsState = {
//       all: [],
//       current: [],
//     }

//     if (!data) {
//       return state
//     }

//     state.all = data.pages
//       .flat()
//       .map(({ businesses }) => businesses)
//       .flat()

//     state.current = state.all.splice(0, max)

//     return state
//   })

//   const businesses = useGetBusinesses(options, {
//     onSuccess(businesses) {
//       const pages = businesses.pages
//       if (pages && pages.length > 0) {
//         const lastPage = pages[pages.length - 1]
//         setCardsState(prev => ({
//           ...prev,
//           all: [...prev.all, ...lastPage.businesses],
//         }))
//       }
//     },
//   })

//   const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = businesses

//   React.useEffect(() => {
//     const { all, current } = cardsState

//     if (all.length > 0 && current.length < max) {
//       setCardsState(prev => {
//         return {
//           all: prev.all.slice(max),
//           current: [...prev.all.slice(0, max), ...prev.current],
//         }
//       })
//     }
//   }, [cardsState])

//   React.useEffect(() => {
//     const pageNum = data ? data.pages.length : 0
//     if (cardsState.all.length < 20 && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage({
//         pageParam: pageNum * 20,
//       })
//     }
//   }, [cardsState.all, data, hasNextPage, isFetchingNextPage, fetchNextPage])

//   return <Cards cards={cardsState.current} setCardsState={setCardsState} />
// }
