import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { ref, onValue, push, set, onDisconnect, remove, ThenableReference } from 'firebase/database'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  MotionProps,
  PanInfo,
  AnimationProps,
} from 'framer-motion'
// import JSConfetti from 'js-confetti'
import type { Theme } from '@mui/material'
// import styled from '@mui/material/styles/styled'
import { alpha } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Grid from '@mui/material/Grid'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Badge from '@mui/material/Badge'
import Hidden from '@mui/material/Hidden'
import CardMedia from '@mui/material/CardMedia'
import { IconButtonProps } from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListSubheader from '@mui/material/ListSubheader'
// import MenuList from '@mui/material/MenuList'
// import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CloseIcon from '@mui/icons-material/Close'
import InfoIcon from '@mui/icons-material/Info'
// import MatchesIcon from '@mui/icons-material/FoodBank'
// import MatchesIcon from '@mui/icons-material/Restaurant'
import UtensilsIcon from '@mui/icons-material/Restaurant'
import MatchesIcon from '@mui/icons-material/Store'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import CardsIcon from '@mui/icons-material/Style'
import NextIcon from '@mui/icons-material/NavigateNext'
import CelebrationIcon from '@mui/icons-material/Celebration'
// import PlaceIcon from '@mui/icons-material/Place'

import { PopulatedParty, BusinessData, SwipeAction, Match } from '../../types'
import { db } from '../../firebase'
import { partyKeys } from '../../utils/queryKeys'
import { PartiesService } from '../../services/parties'
import { useUser, useUIContext } from '../../context'
import { useDeleteParty } from '../../hooks'
import { ListItemBusiness, ListItemBusinessProps } from '../../common/components'
import {
  IconButton,
  Avatar,
  DividerText,
  Stars,
  OpenInNewLink,
  Button,
  NoData,
} from '../../common/components'
import BlockIcon from '../../common/icons/Block'
import DislikeIcon from '../../common/icons/Dislike'
import SuperLikeIcon from '../../common/icons/SuperLike'
import LikeIcon from '../../common/icons/Like'
import FavoriteIcon from '../../common/icons/Favorite'
import { useGetPartyBusinesses, IndexedBusinessData } from './useGetPartyBusinesses'
import { useToggleBusiness } from './useToggleBusiness'
import { PartyInfo } from './PartyInfo'
// import { categories } from '../../components/PartySettingsDrawer/Categories'

// const ConfettiCanvas = styled('canvas')(({ theme }) => ({
//   position: 'fixed',
//   top: 0,
//   left: 0,
//   height: '100%',
//   width: '100%',
//   zIndex: theme.zIndex.modal + 1,
//   pointerEvents: 'none',
// }))

// const emojis = ['🥨', '🍞', '🥓', '🍔', '🍗', '🌭', '🍕', '🌮', '🧇', '🥩']

// const Confetti = () => {
//   const canvasRef = React.useRef<HTMLCanvasElement>(null)
//   const intervalID = React.useRef<NodeJS.Timer | number>()

//   React.useEffect(() => {
//     if (canvasRef.current) {
//       const jsConfetti = new JSConfetti({
//         canvas: canvasRef.current,
//       })

//       jsConfetti.addConfetti({ emojis })
//       intervalID.current = setInterval(() => {
//         jsConfetti.addConfetti({ emojis })
//       }, 5000)

//       return () => {
//         clearInterval(intervalID.current as number)
//       }
//     }
//   }, [])

//   return <ConfettiCanvas ref={canvasRef} />
// }

type MatchDialogProps = DialogProps & {
  match?: Match
  onClose: () => void
  hasMoreMatches: boolean
  setNextMatch: () => void
}

const MatchDialog: React.FC<MatchDialogProps> = props => {
  const { match, setNextMatch, hasMoreMatches, onClose, ...dialogProps } = props

  return (
    <Dialog
      {...dialogProps}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: 360, p: 2, m: 3 } }}
    >
      {/* {match?.type === 'super-like' && <Confetti />} */}
      <Box mb={2} position='relative'>
        <CardMedia
          component='img'
          height={250}
          image={match?.details.image_url}
          alt={match?.details.name}
        />
        <Box
          position='absolute'
          top={0}
          left={0}
          right={0}
          bottom={0}
          display='flex'
          sx={theme => ({
            background: alpha(theme.palette.primary.main, 0.5),
          })}
        >
          <Box
            m='auto'
            display='flex'
            flexDirection='column'
            alignItems='center'
            color={theme => theme.palette.getContrastText(theme.palette.primary.main)}
          >
            <Avatar
              sx={theme => ({
                width: 56,
                height: 56,
                bgcolor: 'transparent',
                border: `2px solid ${theme.palette.getContrastText(theme.palette.primary.main)}`,
              })}
            >
              <CelebrationIcon />
            </Avatar>
            <Typography variant='h5' component='div' fontWeight={900} align='center'>
              Congratulations
              <br /> It's a match!
            </Typography>
          </Box>
          <OpenInNewLink
            href={match?.details.url}
            height={32}
            width={32}
            fontSize='body1.fontSize'
            position='absolute'
            top={8}
            right={8}
          />
        </Box>
      </Box>
      <Grid container>
        <Grid item xs={12}>
          <Box display='flex' alignItems='center' mb={{ xs: 0.5, sm: 1 }}>
            <Box display='flex' alignItems='center' mr='auto'>
              <Stars rating={match?.details.rating} />
              <Typography lineHeight={1} variant='caption' ml={0.5}>
                {match?.details.review_count} Reviews
              </Typography>
            </Box>
            <Chip
              label={match?.details.price}
              size='small'
              color='primary'
              variant='filled'
              sx={{ px: 0.5 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant='body2' fontWeight={600}>
            {match?.details.name}
          </Typography>
          <Box display='flex' alignItems='center'>
            <Typography variant='body2' display='inline'>
              {match?.details.location.city},{' '}
              {match?.details.location.state || match?.details.location.country}
            </Typography>
            <Typography
              variant='caption'
              color='primary'
              mr={1}
              ml='auto'
              sx={{ textDecoration: 'underline' }}
            >
              {match?.details.categories
                .slice(0, 2)
                .map(({ title }) => title)
                .join(', ')}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <Box py={1}>
        <Button
          variant='outlined'
          fullWidth
          sx={{ mt: 1 }}
          startIcon={<NextIcon />}
          onClick={() => setNextMatch()}
          disabled={!hasMoreMatches}
        >
          Next match
        </Button>
        <Button fullWidth sx={{ mt: 1 }} startIcon={<CardsIcon />} onClick={() => onClose()}>
          Keep swiping
        </Button>
      </Box>
    </Dialog>
  )
}

type ActionButtonProps = Omit<IconButtonProps, 'size'> & {
  icon: JSX.Element
  size?: number
  filled?: boolean
  responsive?: boolean
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  size = 32,
  filled = false,
  responsive = true,
  sx = [],
  ...props
}) => {
  return (
    <IconButton
      sx={[
        theme => ({
          height: size,
          width: size,
          color: filled ? 'common.black' : 'transparent',
          p: 0,
          boxShadow: theme.shadows[3],
          ...(responsive && {
            [theme.breakpoints.up('md')]: {
              height: size * 1.25,
              width: size * 1.25,
            },
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {icon}
    </IconButton>
  )
}

type MatchListItemProps = ListItemBusinessProps & {
  match?: Match
}

const MatchListItem: React.FC<MatchListItemProps> = ({ match, ...props }) => {
  const { state, toggleFavorite } = useToggleBusiness(match?.details)

  const isLoading = props.isLoading || state.isLoading

  return (
    <ListItemBusiness
      type={match?.type}
      isLoading={isLoading}
      details={match?.details}
      secondaryAction={
        !isLoading && (
          <ActionButton
            icon={<FavoriteIcon />}
            size={24}
            filled={state.isFavorite}
            responsive={false}
            onClick={() => toggleFavorite()}
          />
        )
      }
      {...props}
    />
  )
}

type MatchesByDate = { date: string; matches: Match[] }[]

type MatchesProps = {
  partyId: string
  closeMatches: () => void
}

const Matches = React.forwardRef<HTMLDivElement, MatchesProps>(({ partyId, closeMatches }, ref) => {
  const user = useUser()
  const [matchQueue, setMatchQueue] = React.useState<Match[]>([])
  const [match, setMatch] = React.useState<Match | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const queryClient = useQueryClient()
  const matchesQuery = useQuery<MatchesByDate>(
    partyKeys.matches(partyId),
    () => new Promise<MatchesByDate>(() => {})
  )

  React.useEffect(() => {
    let isFirstSnapshot = true

    const unsubscribe = PartiesService.onCollectionSnapshot(
      PartiesService.collection
        .matches(partyId)
        .where('members', 'array-contains', user.uid)
        .orderBy('createdAt', 'desc')
        .query(),
      snapshot => {
        const matchesByDate = snapshot.docs.reduce<MatchesByDate>((dates, doc) => {
          if (doc.exists()) {
            const data = doc.data()
            const dateString = data.createdAt.toDate().toDateString()
            const dateIndex = dates.findIndex(match => match.date === dateString)

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
        }, [])

        queryClient.setQueryData(partyKeys.matches(partyId), matchesByDate)

        if (!isFirstSnapshot) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data()

              if (data.type === 'like' && data.lastToSwipe === user.uid) {
                setMatchQueue(prevMatches => [...prevMatches, data])
              }

              if (data.type === 'super-like') {
                setMatchQueue(prevMatches => [...prevMatches, data])
              }
            }
          })
        } else {
          isFirstSnapshot = false
        }
      },
      error => {
        console.log(error)
      }
    )

    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId, user.uid])

  const setNextMatch = React.useCallback(() => {
    const newMatchQueue = [...matchQueue]
    const newMatch = newMatchQueue.shift()
    setMatchQueue(newMatchQueue)

    if (newMatch) {
      setMatch(newMatch)
    }
  }, [matchQueue])

  React.useEffect(() => {
    if (!isOpen && !match && matchQueue.length > 0) {
      setNextMatch()
      setIsOpen(true)
    }
  }, [isOpen, match, matchQueue, setNextMatch])

  const handleClose = React.useCallback(() => {
    if (matchQueue.length > 0) {
      setMatchQueue([])
    }
    setIsOpen(false)
  }, [matchQueue])

  const { isLoading, data } = matchesQuery

  const defaultData = Array<{
    date: undefined
    matches: undefined[]
  }>(1).fill({
    date: undefined,
    matches: Array(5).fill(undefined),
  })

  const matches = data ?? defaultData

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MatchDialog
        match={match!}
        // match={matchesQuery.data ? matchesQuery.data[0].matches[0] : undefined}
        setNextMatch={setNextMatch}
        hasMoreMatches={matchQueue.length > 0}
        open={isOpen && !!match}
        // open={!!matchesQuery.data}
        onClose={handleClose}
        closeAfterTransition
        TransitionProps={{
          onExited: () => {
            setMatch(null)
          },
        }}
      />
      <Box display='flex' justifyContent='space-between' alignItems='center' p={3} pb={1}>
        <Typography variant='h6'>Matches</Typography>
        <Hidden smUp>
          <IconButton onClick={closeMatches}>
            <CloseIcon />
          </IconButton>
        </Hidden>
      </Box>
      <Box ref={ref} sx={{ overflowY: isLoading ? 'hidden' : 'auto' }}>
        {isLoading || matches.length > 0 ? (
          <List subheader={<li />} sx={{ '& ul': { px: 1 } }}>
            {matches.map((group, index) => (
              <li key={index}>
                <ul>
                  {group.date && (
                    <ListSubheader>
                      <DividerText text={group.date} />
                    </ListSubheader>
                  )}
                  {group.matches.map((match, index) => (
                    <MatchListItem
                      key={match ? `${match?.details.id}-${index}` : index}
                      match={match}
                      isLoading={isLoading}
                      divider={!isLoading && index !== group.matches.length - 1}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </List>
        ) : (
          <NoData
            icon={<MatchesIcon fontSize='large' />}
            title='No Matches'
            description='Matches will appear here when all members "like" the same restaurants!'
            maxWidth={200}
          />
        )}
      </Box>
    </Box>
  )
})

type BusinessCardProps = MotionProps & {
  business: BusinessData
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, drag = true, style, ...props }) => (
  <motion.div
    {...props}
    drag={drag}
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    dragDirectionLock
    transition={{ ease: [0.6, 0.05, -0.01, 0.9], duration: 0.5 }}
    whileTap={{ scale: 0.85 }}
    style={{
      ...style,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }}
  >
    <Paper
      sx={theme => ({
        width: '100%',
        height: '100%',
        backgroundImage: `url(${business.image_url})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      })}
    >
      <Box p={2}>
        <OpenInNewLink href={business.url} ml='auto' variant='h6' />
      </Box>
      <Box
        p={{ xs: 2, md: 3 }}
        sx={{
          background: `linear-gradient(
            transparent 0%,
            rgba(0,0,0,0.4) 25%,
            rgba(0,0,0,0.6) 50%,
            rgba(0,0,0,0.8) 75%
          )`,
          color: 'white',
        }}
      >
        <Grid container>
          <Grid item xs={12}>
            <Box display='flex' alignItems='center' mb={{ xs: 0.5, sm: 1 }}>
              <Box display='flex' alignItems='center' mr='auto'>
                <Stars rating={business.rating} />
                <Typography lineHeight={1} variant='caption' ml={0.5}>
                  {business.review_count} Reviews
                </Typography>
              </Box>
              <Chip
                label={business.price}
                size='small'
                color='primary'
                variant='filled'
                sx={{ px: 0.5 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography component='div' variant='body1' fontWeight={600}>
              {business.name}
            </Typography>
            <Typography component='div' variant='caption'>
              {business.location.city}, {business.location.state || business.location.country}
            </Typography>
            <Typography
              component='div'
              variant='caption'
              color='primary'
              sx={{ textDecoration: 'underline' }}
            >
              {business.categories
                .slice(0, 2)
                .map(({ title }) => title)
                .join(', ')}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  </motion.div>
)

type ActionButtonsProps = {
  isDisabled: boolean
  currentBusiness?: BusinessData
  animateSwipe: (action: SwipeAction) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(props => {
  const { isDisabled, currentBusiness, animateSwipe } = props
  const { state, toggleFavorite, toggleBlock } = useToggleBusiness(currentBusiness)

  return (
    <Stack
      direction='row'
      spacing={2}
      justifyContent='center'
      alignItems='center'
      py={{ md: 2 }}
      mt={2}
    >
      <ActionButton
        icon={<BlockIcon />}
        filled={state.isBlocked}
        onClick={() => toggleBlock()}
        disabled={isDisabled}
      />
      <ActionButton
        icon={<DislikeIcon />}
        size={40}
        onClick={() => animateSwipe('dislike')}
        disabled={isDisabled}
      />
      <ActionButton
        icon={<SuperLikeIcon />}
        size={48}
        onClick={() => animateSwipe('super-like')}
        disabled={isDisabled}
      />
      <ActionButton
        icon={<LikeIcon />}
        size={40}
        onClick={() => animateSwipe('like')}
        disabled={isDisabled}
      />
      <ActionButton
        icon={<FavoriteIcon />}
        filled={state.isFavorite}
        onClick={() => toggleFavorite()}
        disabled={isDisabled}
      />
    </Stack>
  )
})

// On each swipe we save user's swipe action (dislike/like/super-like) for the current business
// and update user's offset to the NEXT business (business's offset index + 1)
const useSwipe = (party: PopulatedParty) => {
  return useMutation<
    void,
    unknown,
    {
      action: SwipeAction
      business: IndexedBusinessData
    }
  >(async data => {
    await PartiesService.swipe(party.id, data.business.id, data.action)
    await PartiesService.setOffset(party.id, data.business.index + 1)
  })
}

type InfiniteCardsProps = {
  party: PopulatedParty
  isInfoOpen: boolean
  closeInfo: () => void
}

type InfiniteCardsState = {
  deck: IndexedBusinessData[]
  all: IndexedBusinessData[]
}

const InfiniteCards: React.FC<InfiniteCardsProps> = ({ party, isInfoOpen, closeInfo }) => {
  const [cards, setCards] = React.useState<InfiniteCardsState>({
    deck: [],
    all: [],
  })

  const partyBusinessesQuery = useGetPartyBusinesses(party)
  const { data, status, hasNextPage, isFetchingNextPage, fetchNextPage } = partyBusinessesQuery

  const [isLoadingCards, setIsLoadingCards] = React.useState(() => {
    return status === 'idle' || status === 'loading'
  })

  // console.log(cards, partyBusinessesQuery)

  React.useEffect(() => {
    if (status === 'success' && data && data.pages.length > 0) {
      const latestCards = data.pages[data.pages.length - 1].businesses

      if (data.pages.length === 1) {
        setCards({
          deck: latestCards.slice(0, 3).reverse(),
          all: latestCards.slice(3),
        })
      } else {
        setCards(prevCards => ({
          deck: prevCards.deck,
          all: [...prevCards.all, ...latestCards],
        }))
      }

      setIsLoadingCards(false)

      console.log('onSuccess', latestCards)
    }
  }, [status, data?.pages.length])

  const currentIndexedBusiness = React.useMemo(() => {
    return cards.deck[cards.deck.length - 1]
  }, [cards.deck])

  const currentBusiness = React.useMemo(() => {
    if (!currentIndexedBusiness) {
      return currentIndexedBusiness
    }

    const { index, ...rest } = currentIndexedBusiness
    return rest
  }, [currentIndexedBusiness])

  const swipe = useSwipe(party)

  const handleSwipe = React.useCallback(
    (action: SwipeAction, business?: IndexedBusinessData) => {
      if (business) {
        swipe.mutate({ action, business })
      }
    },
    [swipe]
  )

  const [dragStart, setDragStart] = React.useState<{
    axis: 'x' | 'y' | null
    animation: AnimationProps['animate']
  }>({
    axis: null,
    animation: { x: 0, y: 0 },
  })

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useTransform(dragStart.axis === 'x' ? x : y, [-800, 0, 800], [1, 0.5, 1])
  const shadowBlur = useTransform(dragStart.axis === 'x' ? x : y, [-800, 0, 800], [0, 25, 0])
  const shadowOpacity = useTransform(dragStart.axis === 'x' ? x : y, [-800, 0, 800], [0, 0.2, 0])
  const boxShadow = useMotionTemplate`0 ${shadowBlur}px 25px -5px rgba(0, 0, 0, ${shadowOpacity})`

  const onDirectionLock = (axis: 'x' | 'y' | null) => setDragStart({ ...dragStart, axis })

  const animateSwipe = (action: SwipeAction) => {
    handleSwipe(action, currentIndexedBusiness)

    if (action === 'like') {
      setDragStart({ axis: 'x', animation: { x: 800, y: 0 } })
    } else if (action === 'dislike') {
      setDragStart({ axis: 'x', animation: { x: -800, y: 0 } })
    } else if (action === 'super-like') {
      setDragStart({ axis: 'y', animation: { x: 0, y: -800 } })
    }

    setTimeout(() => {
      setDragStart({ axis: null, animation: { x: 0, y: 0 } })

      x.set(0)
      y.set(0)

      // Refetch the next 20 businesses if there are less than 10 cards in the queue
      if (cards.all.length < 10 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
        console.log('fetching next page...', cards)
      }

      setCards(prevCards => ({
        deck: [...prevCards.all.slice(0, 1), ...prevCards.deck.slice(0, prevCards.deck.length - 1)],
        all: prevCards.all.slice(1),
      }))
    }, 400)
  }

  const onDragEnd = (info: PanInfo) => {
    const threshold = Math.floor(window.innerWidth / 4)

    if (dragStart.axis === 'x') {
      if (info.offset.x >= threshold) {
        animateSwipe('like')
      } else if (info.offset.x <= -threshold) {
        animateSwipe('dislike')
      }
    } else {
      if (info.offset.y <= -threshold) {
        animateSwipe('super-like')
      }
    }
  }

  const renderCards = () => {
    return cards.deck.map((business, index, arr) =>
      index === arr.length - 1 ? (
        <BusinessCard
          key={index}
          business={business}
          onDirectionLock={axis => onDirectionLock(axis)}
          onDragEnd={(e, info) => onDragEnd(info)}
          animate={dragStart.animation}
          style={{ x, y, zIndex: index }}
        />
      ) : (
        <BusinessCard
          key={index}
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
    <>
      <Paper
        sx={{
          p: { xs: 2, md: 3 },
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {isInfoOpen ? (
          <PartyInfo party={party} currentBusiness={currentBusiness} />
        ) : (
          <Box
            position='relative'
            flex={1}
            display='flex'
            justifyContent='center'
            alignItems='center'
          >
            {isLoadingCards ? (
              <Skeleton variant='rectangular' width='100%' height='100%' />
            ) : cards.deck.length > 0 ? (
              renderCards()
            ) : (
              <NoData
                icon={<MatchesIcon fontSize='large' />}
                title='No Businesses'
                description='There are no more businesses left.'
                maxWidth={200}
              />
            )}
          </Box>
        )}
      </Paper>
      <ActionButtons
        // isDisabled={isLoadingCards || !currentBusiness || isInfoOpen}
        isDisabled={isLoadingCards || !currentBusiness}
        currentBusiness={currentBusiness}
        animateSwipe={animateSwipe}
      />
    </>
  )
}

export const Party = () => {
  const { party } = useOutletContext<{ party: PopulatedParty }>()
  const user = useUser()
  const ui = useUIContext()
  const isLargeScreen = useMediaQuery<Theme>(theme => theme.breakpoints.up('lg'))
  const [isInfoOpen, setIsInfoOpen] = React.useState(false)
  const [isMatchesOpen, setIsMatchesOpen] = React.useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = React.useState(false)
  const leaveParty = useDeleteParty()
  const matchesContainerRef = React.useRef<HTMLDivElement>(null)

  const toggleMatches = React.useCallback(() => {
    setIsMatchesOpen(prevOpen => {
      if (!prevOpen) {
        matchesContainerRef.current?.scrollTo({ top: 0 })
      }

      return !prevOpen
    })
  }, [])

  const closeMatches = React.useCallback(() => {
    setIsMatchesOpen(false)
  }, [])

  // A party is active when at least one member is on the party page.
  // Here we keep track of device presence for all party members.
  React.useEffect(() => {
    const connectedRef = ref(db, '.info/connected')
    const connectionsRef = ref(db, `parties/${party.id}/connections`)

    let con: ThenableReference

    const unsubscribe = onValue(connectedRef, snapshot => {
      if (snapshot.val() === false) {
        return
      }

      con = push(connectionsRef)
      onDisconnect(con).remove()
      set(con, true)
    })

    return () => {
      unsubscribe()

      if (con) {
        remove(con)
      }
    }
  }, [party.id])

  return (
    <Box display='flex' flex='1 1 1px' minHeight={0}>
      <Grid container columnSpacing={{ lg: 4 }}>
        <Grid item xs={12} lg={8} display='flex'>
          <Box display='flex' flexDirection='column' flex={1} minHeight={0} minWidth={0}>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={{ xs: 1, md: 2 }}
            >
              <Typography variant='h6'>{party.name}</Typography>
              <Box>
                <IconButton onClick={() => setIsInfoOpen(prevOpen => !prevOpen)}>
                  {isInfoOpen ? <UtensilsIcon /> : <InfoIcon />}
                </IconButton>
                <Hidden mdUp>
                  <IconButton onClick={() => toggleMatches()}>
                    <Badge color='primary'>
                      <MatchesIcon />
                    </Badge>
                  </IconButton>
                </Hidden>
                {party.admin === user.uid ? (
                  <IconButton onClick={() => ui.party.open(party)}>
                    <SettingsIcon />
                  </IconButton>
                ) : (
                  <>
                    <IconButton onClick={() => setIsConfirmDeleteOpen(true)}>
                      <DeleteIcon />
                    </IconButton>
                    <Dialog
                      open={isConfirmDeleteOpen}
                      onClose={() => setIsConfirmDeleteOpen(false)}
                    >
                      <Box p={3}>
                        <Typography mb={2}>Are you sure you want to delete this party?</Typography>
                        <Button sx={{ mr: 1 }} onClick={() => leaveParty.mutate(party)}>
                          Yes
                        </Button>
                        <Button variant='text' onClick={() => setIsConfirmDeleteOpen(false)}>
                          Cancel
                        </Button>
                      </Box>
                    </Dialog>
                  </>
                )}
              </Box>
            </Box>
            <InfiniteCards
              party={party}
              isInfoOpen={isInfoOpen}
              closeInfo={() => setIsInfoOpen(false)}
            />
          </Box>
        </Grid>
        <Grid item lg={4} height={{ lg: '100%' }}>
          <Drawer
            open={isMatchesOpen}
            onClose={closeMatches}
            variant={isLargeScreen ? 'permanent' : 'temporary'}
            anchor='right'
            ModalProps={{
              keepMounted: true,
              disablePortal: true,
            }}
            sx={{
              maxWidth: { sm: 400 },
              width: { xs: '100%', sm: 'auto' },
              '& .MuiDrawer-paper': {
                maxWidth: { sm: 400 },
                width: { xs: '100%', sm: 'auto' },
              },
              height: {
                lg: '100%',
              },
            }}
            PaperProps={{
              elevation: 1,
              sx: {
                overflowY: 'hidden',
                position: {
                  xs: 'fixed',
                  lg: 'static',
                },
              },
            }}
          >
            <Matches ref={matchesContainerRef} partyId={party.id} closeMatches={closeMatches} />
          </Drawer>
        </Grid>
      </Grid>
    </Box>
  )
}

// type PartyOptionsPopperProps = {
//   party: PopulatedParty
//   openMatches: () => void
// }

// const PartyOptionsPopper: React.FC<PartyOptionsPopperProps> = props => {
//   const { party, openMatches } = props
//   const navigate = useNavigate()
//   const user = useUser()
//   const ui = useUIContext()
//   const leaveParty = useDeleteParty()

//   const handleLeaveParty = () => {
//     leaveParty.mutate(party)
//     navigate('/dashboard', { replace: true })
//   }

//   return (
//     <PopperMenu id='party-menu-button' menuId='party-menu' IconButtonProps={{ size: 'small' }}>
//       {({ menuListProps, handleClose }) => (
//         <MenuList {...menuListProps}>
//           <Hidden lgUp>
//             <MenuItem
//               dense
//               onClick={() => {
//                 handleClose()
//                 openMatches()
//               }}
//             >
//               Matches
//             </MenuItem>
//           </Hidden>
//           {user.uid === party?.admin && (
//             <MenuItem
//               dense
//               onClick={() => {
//                 handleClose()
//                 ui.party.open(party)
//               }}
//             >
//               Edit
//             </MenuItem>
//           )}
//           <MenuItem
//             dense
//             sx={theme => ({ color: theme.palette.error.main })}
//             onClick={() => {
//               handleClose()
//               handleLeaveParty()
//             }}
//           >
//             {user.uid === party?.admin ? 'Delete' : 'Leave'}
//           </MenuItem>
//         </MenuList>
//       )}
//     </PopperMenu>
//   )
// }

// type IndexedBusinessData = BusinessData & {
//   index: number
// }

// type IndexedYelpResponse = Omit<YelpResponse, 'businesses'> & {
//   offset: number
//   businesses: IndexedBusinessData[]
// }

// // @refresh reset

// const useGetPartyBusinesses = (
//   party: PopulatedParty,
//   options: UseInfiniteQueryOptions<IndexedYelpResponse, number> = {}
// ) => {
//   const businesses = useGetBusinesses()

//   const [offset, setOffset] = React.useState<number | null>(null)
//   useQuery<number>(partyKeys.offset(party), async () => PartiesService.getYelpOffset(party.id), {
//     notifyOnChangeProps: ['isSuccess'],
//     onSuccess: data => {
//       setOffset(data)
//     },
//   })

//   return useInfiniteQuery<IndexedYelpResponse, number>(
//     partyKeys.businesses(party, offset as number),
//     async ({ pageParam = offset }) => {
//       console.log(pageParam, offset)

//       const data = await PartiesService.getPartyBusinesses({
//         ...party.location,
//         ...party.params,
//         offset: pageParam,
//       })

//       return {
//         ...data,
//         offset: pageParam,
//         businesses: data.businesses.map((business, index) => {
//           // Preload images
//           const image = new Image()
//           image.src = business.image_url

//           return {
//             // Add an offset index to each business
//             index: pageParam + index,
//             ...business,
//           }
//         }),
//       }
//     },
//     {
//       // refetchOnMount: true,
//       // refetchOnMount: 'always',
//       enabled: businesses.isSuccess && offset !== null,
//       getNextPageParam: lastPage => {
//         if (lastPage.total > lastPage.offset + 20) {
//           return lastPage.offset + 20
//         }
//       },
//       select: data => {
//         return {
//           ...data,
//           pages: data.pages.map(page => ({
//             ...page,
//             // Filter out any businesses this user has blocked
//             businesses: page.businesses.filter(yelpBusiness => {
//               return !businesses.data?.some(({ type, details }) => {
//                 return type === 'block' && details.id === yelpBusiness.id
//               })
//             }),
//           })),
//         }
//       },
//       ...options,
//     }
//   )
// }

// onSuccess(data) {
//   const latestCards = data.pages[data.pages.length - 1].businesses
//   console.log('onSuccess', latestCards)
//   if (data.pages.length === 1) {
//     setCards({
//       deck: latestCards.splice(0, 3).reverse(),
//       all: latestCards,
//     })
//   } else {
//     setCards({
//       deck: cards.deck,
//       all: [...cards.all, ...latestCards],
//     })
//   }
// },

// type PartyActionsAreaProps = {
//   party: PopulatedParty
//   openMatches: () => void
// }

// const PartyActionsArea: React.FC<PartyActionsAreaProps> = props => {
//   const { party, openMatches } = props

//   return (
//     <Box display='flex' flexDirection='column' flex={1} minHeight={0}>
//       <Box display='flex' justifyContent='space-between' alignItems='center' mb={1}>
//         <Typography variant='h6'>{party.name}</Typography>
//         <PartyOptionsPopper party={party} openMatches={openMatches} />
//       </Box>
//       <Members members={party.members} />

//       {/* <Paper
//         sx={{
//           p: { xs: 2, md: 3 },
//           flex: 1,
//           display: 'flex',
//           flexDirection: 'column',
//           position: 'relative',
//         }}
//       > */}
//       <InfiniteCards party={party} />
//       {/* </Paper> */}
//       {/* <Box height={{ xs: actionButtonsHeight, md: actionButtonsHeight + 20 }} /> */}
//     </Box>
//   )
// }

// const business = React.useMemo(() => {
//   if (currentYelpBusiness) {
//     return {
//       id: currentYelpBusiness.id,
//       details: {
//         image: currentYelpBusiness.image_url,
//         name: currentYelpBusiness.name,
//         price: currentYelpBusiness.price,
//         rating: currentYelpBusiness.rating,
//         categories: currentYelpBusiness.categories.map(({ title }) => title).join(', '),
//         reviews: currentYelpBusiness.review_count,
//         location: `${currentYelpBusiness.location.city}, ${currentYelpBusiness.location.country}`,
//         url: currentYelpBusiness.url,
//       },
//     }
//   }
// }, [currentYelpBusiness])

// If the yelp businesses pages are cached, we initalize the cards here
// instead of the onSuccess callback
// React.useEffect(() => {
//   if (initialOffset.isSuccess && yelpBusinesses.isSuccess) {
//     const pages = yelpBusinesses.data.pages

//     if (!yelpBusinesses.isFetchedAfterMount) {
//       const latestCards = pages
//         .flat()
//         .map(({ businesses }) => businesses)
//         .flat()

//       const index = latestCards.findIndex(business => {
//         return business.index === initialOffset.data
//       })

//       if (index > -1) {
//         // Start the cards list at the initial offset index
//         latestCards.splice(0, index)
//       }
//       console.log('cached cards:', latestCards)
//       setCards({
//         isLoading: false,
//         current: latestCards.splice(0, 3).reverse(),
//         all: latestCards,
//       })
//     }
//   }
// // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [initialOffset.isSuccess, yelpBusinesses.isSuccess])

// console.log('before fetching next page...', yelpBusinesses.isFetchingNextPage, allCards)
// React.useEffect(() => {
//   const canFetchNext = yelpBusinesses.hasNextPage && !yelpBusinesses.isFetchingNextPage
//   if (allCards && allCards.length < 20 && canFetchNext) {
//     console.log('fetching next page...', allCards.length, yelpBusinesses)
//     yelpBusinesses.fetchNextPage()
//   }
// }, [allCards, yelpBusinesses])
