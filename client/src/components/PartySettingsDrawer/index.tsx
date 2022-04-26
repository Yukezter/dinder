import React from 'react'
import { doc, Timestamp } from 'firebase/firestore'
import throttle from 'lodash.throttle'
import update from 'immutability-helper'
import { useMutation, useQueryClient } from 'react-query'
import Drawer, { DrawerProps } from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Chip from '@mui/material/Chip'
import EatIcon from '@mui/icons-material/Restaurant'

import { usersService } from '../../services'
import {
  useUser,
  useParties,
  User,
  Party,
  PopulatedParty,
} from '../../context/FirestoreContext'
import {
  GooglePlaces,
  ContactSelect,
  Button,
  TextField,
} from '../../common/components'

type OnChangeDistanceSlider = (value: number) => void

type DistanceSliderProps = {
  radius?: number
  onChange: OnChangeDistanceSlider
}

const DistanceSlider = React.memo(
  ({ radius, onChange }: DistanceSliderProps) => {
    const [value, setValue] = React.useState<
      number | string | Array<number | string>
    >(radius || 10)
    React.useEffect(() => {
      onChange(value as number)
    }, [])

    const handleSliderChange = React.useCallback(
      throttle((event: Event, newValue: number | number[]) => {
        setValue(newValue)
        onChange(newValue as number)
      }, 100),
      []
    )

    return (
      <Box>
        <Typography component='div' variant='body1'>
          Distance
        </Typography>
        <Typography component='div' variant='body2' align='right'>
          {value} miles
        </Typography>
        <Slider
          min={0}
          max={100}
          value={typeof value === 'number' ? value : 0}
          onChange={handleSliderChange}
          aria-label='Distance from location'
        />
      </Box>
    )
  }
)

type OnChangePrice = (value: number) => void

const PriceRange = ({
  price,
  onChange,
}: {
  price?: number
  onChange: OnChangePrice
}) => {
  const [value, setValue] = React.useState(price || 3)

  React.useEffect(() => {
    onChange(value)
  }, [value])

  const handlePriceRangeChange = (priceLevel: number) => () => {
    setValue(priceLevel)
  }

  return (
    <Box>
      <Typography component='div' variant='body1' mb={1}>
        Price
      </Typography>
      <Box display='flex' mb={1}>
        {Array.from(Array(4)).map((_, index) => {
          const priceLevel = index + 1
          return (
            <Chip
              key={index}
              label={'$'.repeat(priceLevel)}
              color='primary'
              variant={value >= priceLevel ? 'filled' : 'outlined'}
              onClick={handlePriceRangeChange(priceLevel)}
              sx={{ width: 60, mr: 1 }}
            />
          )
        })}
      </Box>
    </Box>
  )
}

const categoryTypes = [
  { title: 'Breakfast', identifier: 'breakfast_brunch' },
  { title: 'American', identifier: 'tradamerican' },
  { title: 'Asian', identifier: 'asianfusion,chinese,vietnamese,japanese' },
  { title: 'Fast Food', identifier: 'hotdogs' },
  { title: 'Indian', identifier: 'indian' },
  { title: 'Italian', identifier: 'italian' },
  { title: 'Mexican', identifier: 'mexican' },
  { title: 'Seafood', identifier: 'seafood' },
  { title: 'Vegan', identifier: 'vegan' },
  { title: 'Vegetarian', identifier: 'vegetarian' },
  { title: 'Dessert', identifier: 'dessert' },
]

type CategoriesProps = {
  identifiers?: string[]
  onChange?: (identifiers: string[]) => void
}

const Categories: React.FC<CategoriesProps> = ({ identifiers, onChange }) => {
  const [categories, setCategories] = React.useState<string[]>(() => {
    return identifiers
      ? identifiers.map(data => {
          const cat = categoryTypes.find(cat => cat.identifier === data)!
          return cat.title
        })
      : []
  })

  React.useEffect(() => {
    if (onChange) {
      onChange(
        categories.map(category => {
          const cat = categoryTypes.find(type => type.title === category)!
          return cat.identifier
        })
      )
    }
  }, [categories])

  const handleCategoryChange = (title: string) => () => {
    if (!categories.includes(title)) {
      setCategories(prevCategories => prevCategories.concat(title))
    } else {
      setCategories(prevCategories =>
        prevCategories.filter(category => category !== title)
      )
    }
  }

  return (
    <Box>
      <Typography component='div' variant='body1' mb={2}>
        Categories
      </Typography>
      <Grid container spacing={1}>
        {categoryTypes.map(({ title, identifier }) => {
          const isSelected = categories.includes(title)
          return (
            <Grid key={title} item xs='auto'>
              <Chip
                label={title}
                color='primary'
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={handleCategoryChange(title)}
                sx={{
                  width: '100%',
                  ...(isSelected && {
                    border: '1px solid transparent',
                  }),
                }}
              />
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

const useUpdateParty = () => {
  const queryClient = useQueryClient()
  return useMutation<PopulatedParty, unknown, Party>(
    async (data: Party) => {
      await usersService.updateParty(data)
      const members = await usersService.getUsers(data.members)
      return {
        ...data,
        members: members.docs.map(member => member.data()),
      }
    },
    {
      async onSuccess(newParty) {
        queryClient.setQueryData<PopulatedParty[]>(
          'parties',
          (oldParties = []) => {
            if (oldParties.some(oldParty => oldParty.id === newParty.id)) {
              return [...oldParties]
            }
            return [...oldParties, newParty]
          }
        )
      },
    }
  )
}

type PartySettingsOptions = Omit<Partial<Party>, 'settings'> & {
  settings?: Partial<Party['settings']>
}

interface CreatePartyDrawerProps {
  open: boolean
  handleClose: () => void
  options?: PopulatedParty
  onSuccess?: (newSettings: PopulatedParty) => void
}

const PartySettingsDrawer: React.FC<CreatePartyDrawerProps> = props => {
  const { options, open, handleClose, onSuccess } = props
  const user = useUser()
  const updateParty = useUpdateParty()
  const newPartyRef = React.useMemo(() => {
    return doc(usersService.collections.parties.ref)
  }, [open])

  const [partyOptions, setPartyOptions] = React.useState<PartySettingsOptions>(
    () => {
      const { id: partyId, members, settings = {} } = options || {}
      const defaultOptions: PartySettingsOptions = {
        ...options,
        members: members ? members.map(({ uid }) => uid) : [],
        settings: {
          price: 2,
          radius: 20,
          ...settings,
        },
      }

      return {
        ...defaultOptions,
        admin: user.uid,
        id: partyId || newPartyRef.id,
      }
    }
  )

  const onClose = () => {
    if (!updateParty.isLoading) {
      handleClose()
    }
  }

  const handleUpdateParty = () => {
    updateParty.mutate(
      {
        ...partyOptions,
        ...(options?.id && { created: Timestamp.now() }),
        lastActive: Timestamp.now(),
      } as Party,
      {
        onSuccess(newParty) {
          if (onSuccess) {
            onSuccess(newParty)
          }
          onClose()
        },
        onError(error) {
          console.log(error)
        },
        onSettled() {},
      }
    )
  }

  const updateOptions = (data: PartySettingsOptions) => {
    setPartyOptions(prevPartyOptions => ({
      ...prevPartyOptions,
      ...data,
      settings: {
        ...prevPartyOptions.settings,
        ...data.settings,
      },
    }))
  }

  const handleOnChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateOptions({
      name: e.target.value,
    })
  }

  const handleOnChangeContacts = (contacts: User[]) => {
    updateOptions({
      members: [
        ...contacts.map(contact => contact.uid).filter(uid => uid !== user.uid),
        user.uid,
      ],
    })
  }

  const handleOnChangeLocation = (coordinates: {
    lat: number
    lng: number
  }) => {
    updateOptions({
      settings: {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      },
    })
  }

  const handleOnChangeRadius: OnChangeDistanceSlider = radius => {
    updateOptions({
      settings: { radius },
    })
  }

  const handleOnChangePrice: OnChangePrice = price => {
    updateOptions({ settings: { price } })
  }

  const handleOnChangeCategories = (categories: string[]) => {
    updateOptions({ settings: { categories } })
  }

  return (
    <Drawer open={open} onClose={onClose} anchor='right' variant='temporary'>
      <Stack width={{ xs: 320, md: 400 }} p={4} spacing={3}>
        <Typography variant='h6'>Create a party!</Typography>
        <Stack spacing={2}>
          <TextField
            fullWidth
            sx={{ mb: 0 }}
            placeholder='Name your party!'
            defaultValue={partyOptions?.name}
            label='Party Name'
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleOnChangeName}
          />
          <ContactSelect
            selected={partyOptions?.members}
            onChange={handleOnChangeContacts}
          />
          <GooglePlaces onChange={handleOnChangeLocation} />
          <DistanceSlider
            radius={partyOptions?.settings?.radius}
            onChange={handleOnChangeRadius}
          />
          <PriceRange
            price={partyOptions?.settings?.price}
            onChange={handleOnChangePrice}
          />
          <Categories
            identifiers={partyOptions?.settings?.categories}
            onChange={handleOnChangeCategories}
          />
        </Stack>
        <Button onClick={handleUpdateParty} loading={updateParty.isLoading}>
          Create Party
        </Button>
      </Stack>
    </Drawer>
  )
}

export default PartySettingsDrawer
