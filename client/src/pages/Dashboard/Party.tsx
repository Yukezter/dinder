import React from 'react'
import debounce from 'lodash.debounce'
import { useParams, useLocation, Navigate, useNavigate } from 'react-router-dom'
import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseQueryResult,
  QueryKey,
} from 'react-query'
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionTemplate,
  MotionProps,
  PanInfo,
} from 'framer-motion'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Grid from '@mui/material/Grid'
import Dialog, { DialogProps } from '@mui/material/Dialog'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Hidden from '@mui/material/Hidden'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { IconButtonProps } from '@mui/material/IconButton'
import List from '@mui/material/List'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

import { UsersService } from '../../services/users'
import { PartiesService } from '../../services/parties'
import {
  useUser,
  useBusinesses,
  PopulatedParty,
  YelpResponse,
  YelpBusiness,
  Business,
  BusinessesData,
  SwipeAction,
  Match,
} from '../../context/FirestoreContext'
import { useProfile } from '../../context/ProfileViewContext'
import { usePartySettings } from '../../context/PartySettingsContext'
import {
  usePopper,
  useAddBusiness,
  useDeleteBusiness,
  useLeaveParty,
} from '../../hooks'
import { BusinessListItem } from '../../components'
import {
  IconButton,
  Avatar,
  DividerText,
  Stars,
  OpenInNewLink,
} from '../../common/components'
import BlockIcon from '../../common/icons/Block'
import DislikeIcon from '../../common/icons/Dislike'
import SuperLikeIcon from '../../common/icons/SuperLike'
import LikeIcon from '../../common/icons/Like'
import FavoriteIcon from '../../common/icons/Favorite'

const PartyOptionsPopper = ({
  party,
  setParty,
  handleUpdatePartySettings,
  openMatches,
}: {
  party: PopulatedParty
  setParty: React.Dispatch<React.SetStateAction<PopulatedParty | undefined>>
  handleUpdatePartySettings: (updatedParty: PopulatedParty) => void
  openMatches: () => void
}) => {
  const popper = usePopper()
  const user = useUser()
  const { openSettings } = usePartySettings()
  const leaveParty = useLeaveParty(party)

  const handleLeaveParty = () => {
    leaveParty.mutate(party)
    setParty(prevParty => ({
      ...prevParty!,
      members: prevParty!.members.filter(member => {
        return member.uid !== user.uid
      }),
    }))
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
        sx={{ mb: 1.5 }}
      >
        <MoreVertIcon />
      </IconButton>
      <Popper {...popper.getPopperProps()}>
        <ClickAwayListener onClickAway={popper.handlePopperClose}>
          <MenuList component={Paper}>
            <MenuItem
              dense
              sx={{ display: { lg: 'none' } }}
              onClick={() => {
                popper.handlePopperClose()
                openMatches()
              }}
            >
              Matches
            </MenuItem>
            {user.uid === party?.admin && (
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
            )}
            <MenuItem
              dense
              sx={{ color: t => t.palette.error.main }}
              onClick={e => {
                e.preventDefault()
                popper.handlePopperClose()
                handleLeaveParty()
              }}
            >
              {user.uid === party?.admin ? 'Delete' : 'Leave'}
            </MenuItem>
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
  Icon: React.FC
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
          color: 'white',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Icon />
    </IconButton>
  )
}

type MatchDialogProps = DialogProps & {
  match?: Match
}

const MatchDialog: React.FC<MatchDialogProps> = props => {
  const { match, ...dialogProps } = props

  return (
    <Dialog {...dialogProps}>
      <Card sx={{ width: 345, p: 1 }}>
        <Typography variant='h5' component='div' align='center' py={2}>
          {match?.type === 'like' && "It's a match!"}
          {match?.type === 'super-like' && "It's a super match!"}
        </Typography>
        <CardMedia
          component='img'
          height={200}
          image={match?.details.image}
          alt={match?.details.name}
        />
        <CardContent>
          <Grid container>
            <Grid item xs>
              <Typography variant='h6' component='div'>
                {match?.details.name}
              </Typography>
              <Typography variant='body2' component='div' gutterBottom>
                {match?.details.location}
              </Typography>
            </Grid>
            <Grid item xs='auto'>
              <Box
                mt={1}
                display='flex'
                flexDirection='column'
                alignItems='flex-end'
              >
                <Stars rating={match?.details.rating} />
                <Typography variant='caption' mt={0.5} mb={0.5}>
                  {match?.details.reviews} Reviews
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        {/* <CardActions disableSpacing>
          <IconButton aria-label='add to favorites'>
            <FavoriteIcon />
          </IconButton>
        </CardActions> */}
      </Card>
    </Dialog>
  )
}

const useToggleBusiness = (
  businesses: UseQueryResult<BusinessesData, unknown>,
  business?: Omit<Business, 'type'> | Match
) => {
  const [optimisticSave, setOptimisticSave] = React.useState<
    'save' | 'block' | null
  >(null)
  const [trueSave, setTrueSave] = React.useState<'save' | 'block' | null>(null)
  const [isDebouncing, setIsDebouncing] = React.useState(false)
  const addBusiness = useAddBusiness()
  const deleteBusiness = useDeleteBusiness()

  const businessRef = React.useRef<Omit<Business, 'type'> | Match>()
  React.useEffect(() => {
    businessRef.current = business
  }, [business])

  const optimisticSaveRef = React.useRef<'save' | 'block' | null>()
  React.useEffect(() => {
    optimisticSaveRef.current = optimisticSave
  }, [optimisticSave])

  const isDebouncingRef = React.useRef<boolean>(false)
  React.useEffect(() => {
    isDebouncingRef.current = isDebouncing
  }, [isDebouncing])

  React.useEffect(() => {
    if (business && businesses.data && !isDebouncingRef.current) {
      const newSave =
        [...businesses.data.saved, ...businesses.data.blocked].find(
          ({ id }) => id === business.id
        )?.type || null
      optimisticSaveRef.current = newSave
      setOptimisticSave(newSave)
    }
  }, [business, businesses])

  const trueSaveRef = React.useRef<'save' | 'block' | null>(null)
  React.useEffect(() => {
    if (business && businesses.data) {
      const newtrueSave =
        [...businesses.data.saved, ...businesses.data.blocked].find(
          ({ id }) => id === business.id
        )?.type || null
      trueSaveRef.current = newtrueSave
      setTrueSave(newtrueSave)
    }
  }, [business, businesses])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedMutate = React.useCallback(
    debounce((type: 'save' | 'block') => {
      const isDiff = optimisticSaveRef.current !== trueSaveRef.current
      console.log('debounced!', businessRef.current, isDiff)
      if (businessRef.current && isDiff) {
        if (
          !trueSaveRef.current ||
          (trueSaveRef.current && trueSaveRef.current !== type)
        ) {
          addBusiness.mutate({
            id: businessRef.current.id,
            type,
            details: businessRef.current.details,
          })
        } else {
          deleteBusiness.mutate({
            id: businessRef.current.id,
            type,
            details: businessRef.current.details,
          })
        }
      }

      setIsDebouncing(false)
    }, 2000),
    []
  )

  const handleToggleSaveBusiness = React.useCallback(() => {
    setIsDebouncing(true)
    setOptimisticSave(prevSave => (prevSave !== 'save' ? 'save' : null))
    debouncedMutate('save')
  }, [debouncedMutate])

  const cancelToggleSaveBusiness = React.useCallback(() => {
    setIsDebouncing(false)
    debouncedMutate.cancel()
  }, [debouncedMutate])

  const isLoading = addBusiness.isLoading || deleteBusiness.isLoading
  const isOptimisticSave = isDebouncing || isLoading
  const state = isOptimisticSave ? optimisticSave : trueSave

  return {
    state,
    optimisticSave,
    setOptimisticSave,
    trueSave,
    setTrueSave,
    cancelToggleSaveBusiness,
    addBusiness,
    deleteBusiness,
    handleToggleSaveBusiness,
  }
}

type MatchListItemProps = {
  isLoading?: boolean
  match?: Match
  // businesses: UseQueryResult<BusinessesData, unknown>
}

const MatchListItem: React.FC<MatchListItemProps> = props => {
  const { isLoading, match } = props
  const businesses = useBusinesses()
  const { state, handleToggleSaveBusiness } = useToggleBusiness(
    businesses,
    match
  )

  return (
    <BusinessListItem
      key={match?.id}
      type={match?.type}
      isLoading={isLoading}
      details={match?.details}
      secondaryAction={
        !isLoading && (
          <SwipeButton
            Icon={FavoriteIcon}
            onClick={handleToggleSaveBusiness}
            disabled={businesses.isLoading}
            sx={{
              height: 24,
              width: 24,
              mr: 2,
              '& svg': {
                color: state === 'save' ? 'black' : 'white',
              },
            }}
          />
        )
      }
    />
  )
}

type MatchesByDate = { date: string; matches: Match[] }[]

type MatchesProps = {
  partyId: string
  closeMatches: () => void
}

const Matches: React.FC<MatchesProps> = ({ partyId, closeMatches }) => {
  const user = useUser()
  const [liveMatchQueue, setLiveMatchQueue] = React.useState<Match[]>([])
  const [liveMatch, setLiveMatch] = React.useState<Match | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const initialCall = React.useRef(true)
  const queryClient = useQueryClient()
  // const businesses = useBusinesses()
  const matches = useQuery<MatchesByDate>(
    'matches',
    () => new Promise<MatchesByDate>(() => {}),
    {
      placeholderData: Array(1).fill({ matches: Array(6).fill(undefined) }),
      keepPreviousData: true,
    }
  )

  React.useEffect(() => {
    const matchesCollection = PartiesService.collection.matches(partyId)
    const matchesQuery = matchesCollection
      .where('members', 'array-contains', user.uid)
      .orderBy('createdAt', 'desc')
      .query()
    const unsubscribe = PartiesService.onCollectionSnapshot(
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

        queryClient.setQueryData('matches', sortedMatches)

        if (!initialCall.current) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data()
              if (data.type === 'like' && data.lastToSwipe === user.uid) {
                setLiveMatchQueue(prevMatches => [...prevMatches, data])
              }

              if (data.type === 'super-like') {
                setLiveMatchQueue(prevMatches => [...prevMatches, data])
              }
            }
          })
        } else {
          initialCall.current = false
        }
      },
      error => {
        console.log(error)
      }
    )

    return unsubscribe
  }, [partyId, user.uid, queryClient])

  React.useEffect(() => {
    if (!isOpen && !liveMatch && liveMatchQueue.length > 0) {
      const newLiveMatches = [...liveMatchQueue]
      const newLiveMatch = newLiveMatches.shift()
      setLiveMatchQueue(newLiveMatches)
      if (newLiveMatch) {
        setLiveMatch(newLiveMatch)
      }
      setIsOpen(true)
    }
  }, [isOpen, liveMatch, liveMatchQueue])

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  // const isLoading = !matches.isFetched || businesses.isLoading
  const isLoading = !matches.isFetched

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MatchDialog
        open={isOpen && !!liveMatch}
        match={liveMatch!}
        onClose={handleClose}
        closeAfterTransition
        TransitionProps={{
          onExited: () => {
            setLiveMatch(null)
          },
        }}
      />
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6'>Matches</Typography>
        <Hidden smUp>
          <IconButton onClick={closeMatches}>
            <ArrowForwardIcon />
          </IconButton>
        </Hidden>
      </Box>
      <Box
        sx={{
          overflowY: isLoading ? 'hidden' : 'auto',
        }}
      >
        {matches.data!.map((group, index) => (
          <Box key={index}>
            {!isLoading && <DividerText text={group.date} />}
            <List>
              {group.matches.map((match, index) => (
                <MatchListItem
                  key={match ? `${match?.id}-${index}` : index}
                  isLoading={isLoading}
                  match={match}
                  // businesses={businesses}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
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

type BusinessCardProps = MotionProps & {
  business: YelpBusiness
}

const BusinessCard: React.FC<BusinessCardProps> = ({
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
        <OpenInNewLink href={business.url} ml='auto' fontSize={24} />
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

type ActionButtonsProps = {
  isLoading: boolean
  businesses: UseQueryResult<BusinessesData, unknown>
  currentYelpBusiness?: YelpBusiness
  animateCardSwipe: (action: SwipeAction) => void
}

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(props => {
  const { isLoading, businesses, currentYelpBusiness, animateCardSwipe } = props

  const business = React.useMemo(() => {
    if (!currentYelpBusiness) {
      return undefined
    }

    return {
      id: currentYelpBusiness.id,
      details: {
        image: currentYelpBusiness.image_url,
        name: currentYelpBusiness.name,
        price: currentYelpBusiness.price,
        rating: currentYelpBusiness.rating,
        categories: currentYelpBusiness.categories
          .map(({ title }) => title)
          .join(', '),
        reviews: currentYelpBusiness.review_count,
        location: `${currentYelpBusiness.location.city}, ${currentYelpBusiness.location.country}`,
        url: currentYelpBusiness.url,
      },
    }
  }, [currentYelpBusiness])

  const noBusinesses = React.useMemo(() => !business, [business])
  const isDisabled = isLoading || noBusinesses

  const {
    state,
    trueSave,
    setTrueSave,
    setOptimisticSave,
    addBusiness,
    handleToggleSaveBusiness,
    cancelToggleSaveBusiness,
  } = useToggleBusiness(businesses, business)

  const dislikeAndBlock = React.useCallback(() => {
    if (business) {
      setOptimisticSave('block')
      setTrueSave('block')
      cancelToggleSaveBusiness()
      addBusiness.mutate({
        id: business.id,
        type: 'block',
        details: business.details,
      })
      animateCardSwipe('dislike')
    }
  }, [
    business,
    setOptimisticSave,
    setTrueSave,
    addBusiness,
    cancelToggleSaveBusiness,
    animateCardSwipe,
  ])

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
      <SwipeButton
        Icon={BlockIcon}
        onClick={dislikeAndBlock}
        disabled={isDisabled}
        sx={{ color: trueSave === 'block' ? 'black' : 'white' }}
      />
      <SwipeButton
        Icon={DislikeIcon}
        width={52}
        onClick={() => animateCardSwipe('dislike')}
        disabled={isDisabled}
      />
      <SwipeButton
        Icon={SuperLikeIcon}
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
        onClick={handleToggleSaveBusiness}
        disabled={isDisabled}
        sx={{ color: state === 'save' ? 'black' : 'white' }}
      />
    </Stack>
  )
})

const useInitialOffset = (
  queryKey: QueryKey,
  options?: UseQueryOptions<number>
) => {
  return useQuery<number>(
    queryKey,
    async ({ queryKey }) =>
      PartiesService.getInitialOffset(
        queryKey[1] as string,
        queryKey[2] as string
      ),
    {
      // enabled: false,
      ...options,
    }
  )
}

type IndexedYelpBusiness = YelpBusiness & {
  index: number
}

type IndexedYelpResponse = Omit<YelpResponse, 'businesses'> & {
  businesses: IndexedYelpBusiness[]
}

const useGetYelpBusinesses = (
  initialOffset: number,
  params: PopulatedParty['params'] & PopulatedParty['location'],
  options: UseInfiniteQueryOptions<YelpResponse, unknown, IndexedYelpResponse>
) => {
  return useInfiniteQuery<YelpResponse, unknown, IndexedYelpResponse>(
    [
      'cards',
      params.place_id,
      params.radius,
      params.price,
      params.categories.join(),
    ],
    async ({ pageParam = 0 }) => {
      const data = await PartiesService.getYelpBusinesses({
        ...params,
        offset: initialOffset + pageParam,
      })

      data.businesses.forEach(business => {
        const image = new Image()
        image.src = business.image_url
      })

      return data
    },
    {
      // cacheTime: 24 * 60 * 60 * 1000,
      select(data) {
        return {
          pageParams: data.pageParams,
          pages: data.pages.map((page, pageIndex) => {
            return {
              ...page,
              businesses: page.businesses.map((business, businessIndex) => ({
                index: pageIndex * 20 + (businessIndex + 1),
                ...business,
              })),
            }
          }),
        }
      },
      getNextPageParam: (lastPage, pages) => {
        return lastPage.total > pages.length * 20 + initialOffset
      },
      ...options,
    }
  )
}

type InfiniteCardsProps = {
  party: PopulatedParty
}

const InfiniteCards: React.FC<InfiniteCardsProps> = ({ party }) => {
  const user = useUser()
  const businesses = useBusinesses()
  const { location, params } = party

  const initialOffset = useInitialOffset([
    'cards',
    user.uid,
    party.id,
    location.place_id,
    params.radius,
    params.price,
    params.categories.join(),
  ])

  const yelpBusinesses = useGetYelpBusinesses(
    initialOffset.data!,
    {
      ...party.location,
      ...party.params,
    },
    {
      enabled: !businesses.isLoading && !initialOffset.isLoading,
      onSuccess(yelpBusinesses) {
        const pages = yelpBusinesses.pages
        if (pages && pages.length > 0) {
          const lastPage = pages[pages.length - 1]
          // Filter out businesses this user has blocked
          const newCards = lastPage.businesses.filter(yelpBusiness => {
            return (
              businesses.data!.blocked.findIndex(
                business => business.id === yelpBusiness.id
              ) === -1
            )
          })

          if (pages.length === 1) {
            setCards(newCards.splice(0, 3).reverse())
            setAllCards(newCards)
          } else {
            setAllCards(prev => [...prev, ...newCards])
          }
        }
      },
    }
  )

  const [allCards, setAllCards] = React.useState<IndexedYelpBusiness[]>(() => {
    if (!yelpBusinesses.data) {
      return []
    }

    return yelpBusinesses.data.pages
      .flat()
      .map(({ businesses }) => businesses)
      .flat()
  })

  const [cards, setCards] = React.useState<IndexedYelpBusiness[]>(() => {
    const initialCards = allCards.slice(0, 3).reverse()
    setAllCards(prevAllCards => prevAllCards.slice(3))
    return initialCards
  })

  const swipeMutation = useMutation<
    void,
    unknown,
    {
      action: SwipeAction
      initialOffset: number
      business: IndexedYelpBusiness
    }
  >(async data => {
    await PartiesService.swipe(
      user.uid,
      party.id,
      data.business.id,
      data.action
    )

    await PartiesService.setInitialOffset(
      user.uid,
      party.id,
      data.initialOffset + data.business.index
    )
  })

  const handleSwipe = React.useCallback(
    (action: SwipeAction, business?: IndexedYelpBusiness) => {
      if (business) {
        swipeMutation.mutate({
          action,
          initialOffset: initialOffset.data!,
          business,
        })
      }
    },
    [swipeMutation, initialOffset]
  )

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    yelpBusinesses

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
      handleSwipe(action, cards[cards.length - 1])

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
    [handleSwipe, dragStart, x, y, allCards, cards]
  )

  const onDragEnd = React.useCallback(
    (info: PanInfo) => {
      if (dragStart.axis === 'x') {
        if (info.offset.x >= 100) animateCardSwipe('like')
        else if (info.offset.x <= -100) animateCardSwipe('dislike')
      } else {
        if (info.offset.y <= -100) animateCardSwipe('super-like')
      }
    },
    [dragStart, animateCardSwipe]
  )

  const renderCards = () => {
    return cards.map((business, index) =>
      index === cards.length - 1 ? (
        <BusinessCard
          key={business.id ? `${business.id}-${index}` : index}
          business={business}
          style={{ x, y, zIndex: index, touchAction: 'none' }}
          onDirectionLock={axis => onDirectionLock(axis)}
          onDragEnd={(e, info) => onDragEnd(info)}
          animate={dragStart.animation}
        />
      ) : (
        <BusinessCard
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
        {initialOffset.isLoading || yelpBusinesses.isLoading ? (
          <Skeleton variant='rectangular' width='100%' height='100%' />
        ) : cards.length > 0 ? (
          renderCards()
        ) : (
          <Box maxWidth={300}>
            <Typography variant='caption'>
              No more businesses available. Wait for other party members to
              swipe for matches, or change the party settings for a new set of
              businesses.
            </Typography>
          </Box>
        )}
      </Box>
      <ActionButtons
        isLoading={yelpBusinesses.isLoading}
        businesses={businesses}
        currentYelpBusiness={cards[cards.length - 1]}
        animateCardSwipe={animateCardSwipe}
      />
    </div>
  )
}

// const InfiniteCards: React.FC<InfiniteCardsProps> = ({ party }) => {
//   const user = useUser()
//   const businesses = useBusinesses()
//   const yelpBusinesses = useGetYelpBusinesses(
//     {
//       ...party.location,
//       ...party.params,
//     },
//     {
//       enabled: !businesses.isLoading,
//       onSuccess(yelpBusinesses) {
//         const pages = yelpBusinesses.pages
//         if (pages && pages.length > 0) {
//           const lastPage = pages[pages.length - 1]
//           // Filter out businesses this user has blocked
//           const newCards = lastPage.businesses.filter(yelpBusiness => {
//             return (
//               businesses.data!.blocked.findIndex(
//                 business => business.id === yelpBusiness.id
//               ) === -1
//             )
//           })

//           if (pages.length === 1 && cards.length === 0) {
//             setCards(newCards.splice(0, 3).reverse())
//           }

//           setAllCards(prev => [...prev, ...newCards])
//         }
//       },
//     }
//   )

//   const [allCards, setAllCards] = React.useState<YelpBusiness[]>(() => {
//     if (!yelpBusinesses.data) {
//       return []
//     }

//     return yelpBusinesses.data.pages
//       .flat()
//       .map(({ businesses }) => businesses)
//       .flat()
//   })

//   const [cards, setCards] = React.useState<YelpBusiness[]>(() => {
//     const initialCards = allCards.slice(0, 3).reverse()
//     setAllCards(prevAllCards => prevAllCards.slice(3))
//     return initialCards
//   })

//   const swipeMutation = useMutation<
//     void,
//     unknown,
//     { business: YelpBusiness; action: SwipeAction }
//   >(async data =>
//     PartiesService.swipe(party.id, data.business.id, user.uid, data.action)
//   )

//   const handleSwipe = React.useCallback(
//     (action: SwipeAction, business?: YelpBusiness) => {
//       if (business) {
//         swipeMutation.mutate({
//           action,
//           business,
//         })
//       }
//     },
//     [swipeMutation]
//   )

//   const { data, isFetchingNextPage, fetchNextPage, hasNextPage } =
//     yelpBusinesses

//   React.useEffect(() => {
//     const pageNum = data ? data.pages.length : 0
//     if (allCards.length < 20 && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage({
//         pageParam: pageNum * 20,
//       })
//     }
//   }, [allCards, data, hasNextPage, isFetchingNextPage, fetchNextPage])

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
//     (action: SwipeAction) => {
//       handleSwipe(action, cards[cards.length - 1])

//       if (action === 'like') {
//         setDragStart({ ...dragStart, animation: { x: 800, y: 0 } })
//       } else if (action === 'dislike') {
//         setDragStart({ ...dragStart, animation: { x: -800, y: 0 } })
//       } else if (action === 'super-like') {
//         setDragStart({ ...dragStart, animation: { x: 0, y: -800 } })
//       }

//       setTimeout(() => {
//         setDragStart({ axis: null, animation: { x: 0, y: 0 } })

//         x.set(0)
//         y.set(0)

//         setCards([...allCards.slice(0, 1), ...cards.slice(0, cards.length - 1)])
//         setAllCards(allCards.slice(1))
//       }, 200)
//     },
//     [handleSwipe, dragStart, x, y, allCards, cards]
//   )

//   const onDragEnd = React.useCallback(
//     (info: PanInfo) => {
//       if (dragStart.axis === 'x') {
//         if (info.offset.x >= 300) animateCardSwipe('like')
//         else if (info.offset.x <= -300) animateCardSwipe('dislike')
//       } else {
//         if (info.offset.y <= -300) animateCardSwipe('super-like')
//       }
//     },
//     [dragStart, animateCardSwipe]
//   )

//   const renderCards = () => {
//     return cards.map((business, index) =>
//       index === cards.length - 1 ? (
//         <BusinessCard
//           key={business.id ? `${business.id}-${index}` : index}
//           business={business}
//           style={{ x, y, zIndex: index }}
//           onDirectionLock={axis => onDirectionLock(axis)}
//           onDragEnd={(e, info) => onDragEnd(info)}
//           animate={dragStart.animation}
//         />
//       ) : (
//         <BusinessCard
//           key={business.id ? `${business.id}-${index}` : index}
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
//     <div style={{ height: '100%', position: 'relative' }}>
//       <Box
//         height='100%'
//         maxHeight={600}
//         position='relative'
//         display='flex'
//         justifyContent='center'
//         alignItems='center'
//         overflow='hidden'
//       >
//         {yelpBusinesses.isLoading ? (
//           <Skeleton variant='rectangular' width='100%' height='100%' />
//         ) : (
//           renderCards()
//         )}
//       </Box>
//       <ActionButtons
//         businesses={businesses}
//         currentYelpBusiness={cards[cards.length - 1]}
//         animateCardSwipe={animateCardSwipe}
//       />
//     </div>
//   )
// }

type PartyActionsAreaProps = {
  party: PopulatedParty
  setParty: React.Dispatch<React.SetStateAction<PopulatedParty | undefined>>
  openMatches: () => void
}

const PartyActionsArea: React.FC<PartyActionsAreaProps> = props => {
  const { party, setParty, openMatches } = props

  React.useEffect(() => {
    const partyRef = PartiesService.doc.party(party.id)
    PartiesService.onDocumentSnapshot(
      partyRef,
      snapshot => {
        const data = snapshot.data()
        if (data) {
          UsersService.getUsers(data.members)
            .then(snapshot => {
              const members = snapshot.docs.map(doc => doc.data())
              setParty({
                ...data,
                members,
              })
            })
            .catch(error => {
              console.log(error)
            })
        }
      },
      error => {
        console.log(error)
      }
    )
  }, [party.id, setParty])

  const updateParty = React.useCallback(
    (updatedParty: React.SetStateAction<PopulatedParty | undefined>) => {
      setParty(updatedParty)
    },
    [setParty]
  )

  return (
    <>
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
            {party.name}
          </Typography>
          <PartyOptionsPopper
            party={party}
            setParty={setParty}
            openMatches={openMatches}
            handleUpdatePartySettings={updateParty}
          />
        </Box>
        <Members members={party.members} />
        <InfiniteCards party={party} />
      </Paper>
      <Box
        height={100}
        display='flex'
        justifyContent='center'
        alignItems='center'
      ></Box>
    </>
  )
}

const PartyView = () => {
  const { partyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const matches = useMediaQuery(theme.breakpoints.up('lg'))
  const user = useUser()
  const [isMatchesOpen, setIsMatchesOpen] = React.useState(false)

  const openMatches = React.useCallback(() => {
    setIsMatchesOpen(true)
  }, [])

  const closeMatches = React.useCallback(() => {
    setIsMatchesOpen(false)
  }, [])

  const [party, setParty] = React.useState<PopulatedParty | undefined>(() => {
    const locationState = (location.state as { party?: PopulatedParty }) || {}
    return locationState?.party
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

  const isNotAMember = !party?.members.some(member => {
    return member.uid === user.uid
  })

  if (!partyId || !party || isNotAMember) {
    return <Navigate to='/dashboard' replace />
  }

  return (
    <Grid container columnSpacing={4} height='100%'>
      <Grid item xs={12} lg={8} height='100%'>
        <Box height='100%'>
          <PartyActionsArea
            party={party}
            setParty={setParty}
            openMatches={openMatches}
          />
        </Box>
      </Grid>
      <Grid item lg height={{ lg: '100%' }}>
        <Drawer
          open={isMatchesOpen}
          onClose={closeMatches}
          variant={matches ? 'permanent' : 'temporary'}
          anchor='right'
          ModalProps={{
            disablePortal: true,
            keepMounted: true,
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
            p: {
              lg: 1,
            },
            m: {
              lg: -1,
            },
          }}
          PaperProps={{
            elevation: 1,
            sx: {
              p: 3,
              overflowY: 'hidden',
              position: {
                xs: 'fixed',
                lg: 'static',
              },
            },
          }}
        >
          <Matches partyId={partyId} closeMatches={closeMatches} />
        </Drawer>
      </Grid>
    </Grid>
  )
}

export default PartyView
