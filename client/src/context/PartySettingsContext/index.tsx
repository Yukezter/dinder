import React from 'react'
import debounce from 'lodash.debounce'
import { doc, Timestamp } from 'firebase/firestore'
import { useMutation, useQueryClient, UseMutationOptions } from 'react-query'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { usersService } from '../../services'
import { useUser, User, PopulatedParty } from '../FirestoreContext'
import { Button, TextField } from '../../common/components'
import ContactSelect from './ContactSelect'
import GooglePlaces from './GooglePlaces'
import DistanceSlider from './DistanceSlider'
import PriceRange from './PriceRange'
import Categories from './Categories'

const useUpdateParty = () => {
  const queryClient = useQueryClient()
  return useMutation<PopulatedParty, unknown, PopulatedParty>(
    async data => {
      await usersService.updateParty({
        ...data,
        members: data.members.map(({ uid }) => uid),
      })

      return data
    },
    {
      async onSuccess(newParty) {
        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            return [
              ...oldParties.filter(({ id }) => id !== newParty.id),
              newParty,
            ]
          }
        )
      },
    }
  )
}

type PartySettingsState = {
  party: Omit<
    PopulatedParty,
    'id' | 'name' | 'location' | 'createdAt' | 'lastActive'
  > & {
    id?: PopulatedParty['id']
    name?: PopulatedParty['name']
    location?: PopulatedParty['location']
    createdAt?: PopulatedParty['createdAt']
    lastActive?: PopulatedParty['lastActive']
  }
  onSuccess?: UseMutationOptions<
    PopulatedParty,
    unknown,
    PopulatedParty
  >['onSuccess']
  onError?: UseMutationOptions<
    PopulatedParty,
    unknown,
    PopulatedParty
  >['onError']
}

type PartyDrawerContext = {
  openSettings: (
    settings?: Omit<PartySettingsState, 'party'> & {
      party?: PopulatedParty | undefined
    }
  ) => void
}

const PartySettingsContext = React.createContext<PartyDrawerContext>(
  {} as PartyDrawerContext
)

export const usePartySettings = () =>
  React.useContext<PartyDrawerContext>(PartySettingsContext)

export const PartySettingsProvider: React.FC = props => {
  const { children } = props
  const user = useUser()
  const updateParty = useUpdateParty()

  const [isOpen, setIsOpen] = React.useState(false)

  const onClose = React.useCallback(() => {
    if (!updateParty.isLoading) {
      setIsOpen(false)
    }
  }, [updateParty.isLoading])

  const [state, setState] = React.useState<PartySettingsState | null>(null)
  const [name, setName] = React.useState<string>('')

  const resetState = React.useCallback(() => {
    setState(null)
  }, [])

  const updateState = (
    party: Omit<Partial<PopulatedParty>, 'params'> & {
      params?: Partial<PopulatedParty['params']>
    }
  ) => {
    setState(prevState => ({
      ...prevState,
      party: {
        ...prevState!.party,
        ...party,
        params: {
          ...prevState!.party.params!,
          ...party?.params,
        },
      },
    }))
  }

  const openSettings = React.useCallback(
    (
      options: Omit<PartySettingsState, 'party'> & {
        party?: PopulatedParty
      } = {}
    ) => {
      const { party } = options
      const partyDefaults = {
        admin: user.uid,
        active: false,
        params: {
          radius: 20,
          price: 2,
          categories: [],
        },
      }

      setState({
        ...options,
        party: {
          ...partyDefaults,
          ...party,
          members: party
            ? party.members.filter(({ uid }) => uid !== user.uid)
            : [],
        },
      })

      setIsOpen(true)
    },
    [user.uid]
  )

  const handleUpdateParty = () => {
    if (isOpen && state) {
      const { party } = state

      if (party.location) {
        const id = party?.id || doc(usersService.collections.parties.ref).id
        updateParty.mutate(
          {
            ...party,
            id,
            name,
            members: [...party.members, user],
            location: party.location!,
            createdAt: party.createdAt || Timestamp.now(),
            lastActive: party.lastActive || Timestamp.now(),
          },
          {
            onSuccess(...args) {
              if (state.onSuccess) {
                state.onSuccess(...args)
              }

              setIsOpen(false)
            },
            onError(...args) {
              if (state.onError) {
                state.onError(...args)
              }
            },
          }
        )
      }
    }
  }

  const handleOnChangeName = React.useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value)
    }, 200),
    []
  )

  const handleOnChangeContacts = (selected: User[]) => {
    updateState({
      members: [...selected],
    })
  }

  const handleOnChangeLocation = (location?: PopulatedParty['location']) => {
    updateState({ location })
  }

  const handleOnChangeRadius = (radius: number) => {
    updateState({
      params: { radius },
    })
  }

  const handleOnChangePrice = (price: number) => {
    updateState({ params: { price } })
  }

  const handleOnChangeCategories = (categories: string[]) => {
    updateState({ params: { categories } })
  }

  const party = state?.party
  const isDisabled = !name || party?.members?.length === 0 || !party?.location

  return (
    <PartySettingsContext.Provider value={{ openSettings }}>
      <Drawer
        open={isOpen && !!state}
        onClose={onClose}
        anchor='right'
        variant='temporary'
        SlideProps={{ onExited: () => resetState() }}
      >
        <Stack width={{ xs: 320, md: 400 }} p={4} spacing={3}>
          <Typography variant='h6'>
            {!state?.party.id ? 'Create a party!' : state.party.name}
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              sx={{ mb: 0 }}
              label='Party Name'
              InputLabelProps={{
                shrink: true,
              }}
              placeholder='Name your party!'
              defaultValue={state?.party.name}
              onChange={handleOnChangeName}
            />
            <ContactSelect
              selected={state?.party.members}
              onChange={handleOnChangeContacts}
            />
            <GooglePlaces
              location={state?.party.location}
              onChange={handleOnChangeLocation}
            />
            <DistanceSlider
              radius={state?.party.params.radius}
              onChange={handleOnChangeRadius}
            />
            <PriceRange
              price={state?.party.params.price}
              onChange={handleOnChangePrice}
            />
            <Categories
              identifiers={state?.party.params.categories}
              onChange={handleOnChangeCategories}
            />
          </Stack>
          <Button
            onClick={handleUpdateParty}
            loading={updateParty.isLoading}
            disabled={isDisabled}
          >
            {!state?.party.id ? 'Create Party' : 'Update Party'}
          </Button>
        </Stack>
      </Drawer>
      {children}
    </PartySettingsContext.Provider>
  )
}

export default PartySettingsProvider

// const handleOnChangeName = React.useCallback(
//   (e: React.ChangeEvent<HTMLInputElement>) => {
//     updateState({
//       name: e.target.value,
//     })
//   },
//   []
// )

// const handleOnChangeContacts = React.useCallback((contacts: User[]) => {
//   updateState({
//     members: [
//       ...contacts.map(contact => contact.uid).filter(uid => uid !== user.uid),
//       user.uid,
//     ],
//   })
// }, [])

// const handleOnChangeLocation = React.useCallback(
//   (
//     description: string,
//     coordinates: {
//       lat: number
//       lng: number
//     }
//   ) => {
//     updateState({
//       settings: {
//         placesDescription: description,
//         latitude: coordinates.lat,
//         longitude: coordinates.lng,
//       },
//     })
//   },
//   []
// )

// const handleOnChangeRadius: OnChangeDistanceSlider = React.useCallback(
//   radius => {
//     updateState({
//       settings: { radius },
//     })
//   },
//   []
// )

// const handleOnChangePrice: OnChangePrice = React.useCallback(price => {
//   updateState({ settings: { price } })
// }, [])

// const handleOnChangeCategories = React.useCallback((categories: string[]) => {
//   updateState({ settings: { categories } })
// }, [])
