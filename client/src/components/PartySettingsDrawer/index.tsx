import React from 'react'
import { doc } from 'firebase/firestore'
import { useIsMutating } from 'react-query'
import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import pick from 'lodash.pick'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'

import { PopulatedParty, UpdatePartyFields } from '../../types'
import { PartiesService } from '../../services/parties'
import { useUIContext, AlgoliaSearch, useUser } from '../../context'
import { useUpdateParty } from '../../hooks'
import { Button, TextField, IconButton } from '../../common/components'
import ContactSelect from './ContactSelect'
import GooglePlaces from './GooglePlaces'
import DistanceSlider from './DistanceSlider'
import PriceRange from './PriceRange'
import Categories from './Categories'

type FormInputs = UpdatePartyFields

type PartyDrawerContentProps = {
  initialState: Partial<PopulatedParty> | null
}

const PartyDrawerContent: React.FC<PartyDrawerContentProps> = props => {
  const { initialState } = props
  const ui = useUIContext()
  const user = useUser()

  const defaultValues = React.useMemo<UpdatePartyFields>(
    () => ({
      id: doc(PartiesService.collection.parties().ref).id,
      name: '',
      members: !initialState?.members
        ? []
        : initialState.members.filter(member => member.uid !== user.uid),
      location: null,
      params: {
        radius: 20,
        price: 2,
        categories: [],
      },
      ...pick(initialState, ['id', 'name', 'location', 'params']),
    }),
    [initialState, user.uid]
  )

  const { register, control, handleSubmit } = useForm<FormInputs>({
    defaultValues,
  })

  const updateParty = useUpdateParty({
    mutationKey: ['party', 'update', defaultValues.id],
  })

  const onSubmit: SubmitHandler<FormInputs> = data => {
    console.log(data)
    updateParty.mutate(data)
    ui.party.close()
  }

  const onClose = () => {
    if (!updateParty.isLoading) {
      ui.party.close()
    }
  }

  const isNewParty = !initialState?.id
  const isLoading = updateParty.isLoading
  const isDisabled = updateParty.isLoading

  return (
    <Stack component='form' width={{ sm: 400 }} p={4} spacing={3} onSubmit={handleSubmit(onSubmit)}>
      <Box display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h6'>{isNewParty ? 'Create' : 'Update'} Party</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Stack>
        <TextField
          {...register('name', { required: 'A name is required' })}
          label='Name'
          placeholder='Name your party!'
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <Controller
          name='members'
          control={control}
          rules={{ validate: value => value.length > 0 }}
          render={({ field, fieldState }) => (
            <AlgoliaSearch>
              <ContactSelect {...field} fieldState={fieldState} />
            </AlgoliaSearch>
          )}
        />
        <Controller
          name='location'
          control={control}
          rules={{ required: true }}
          render={({ field, fieldState }) => <GooglePlaces {...field} fieldState={fieldState} />}
        />
        <Controller
          name='params.radius'
          control={control}
          rules={{ min: 10, max: 25 }}
          render={({ field: { ref, ...field } }) => <DistanceSlider {...field} />}
        />
        <Controller
          name='params.price'
          control={control}
          render={({ field: { ref, ...field } }) => <PriceRange {...field} />}
        />
        <Controller
          name='params.categories'
          control={control}
          render={({ field: { ref, ...field } }) => <Categories {...field} />}
        />
      </Stack>
      <Box display='flex'>
        <Button type='submit' loading={isLoading} disabled={isDisabled} sx={{ px: 4 }}>
          {isNewParty ? 'Create' : 'Update'}
        </Button>
      </Box>
    </Stack>
  )
}

export const PartySettingsDrawer: React.FC = props => {
  const ui = useUIContext()
  const isMutating = useIsMutating({ mutationKey: ['party', 'update'] })

  const onClose = React.useCallback(() => {
    if (isMutating === 0) {
      ui.party.close()
    }
  }, [isMutating, ui.party])

  return (
    <Drawer
      open={ui.party.isOpen}
      onClose={onClose}
      anchor='right'
      variant='temporary'
      SlideProps={{ onExited: () => ui.party.clear() }}
      sx={{ zIndex: theme => theme.zIndex.drawer + 2 }}
    >
      <PartyDrawerContent initialState={ui.party.settings} />
    </Drawer>
  )
}

export default PartySettingsDrawer
