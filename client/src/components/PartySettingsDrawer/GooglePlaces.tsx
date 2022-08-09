import React from 'react'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import PinIcon from '@mui/icons-material/PinDrop'

import { UpdatePartyFields, Place } from '../../types'
import TextField from '../../common/components/TextField'

type GooglePlacesProps = ControllerRenderProps<UpdatePartyFields, 'location'> & {
  fieldState: ControllerFieldState
}

const GooglePlaces = React.forwardRef<React.RefCallback<HTMLInputElement>, GooglePlacesProps>(
  (props, ref) => {
    const { name, value, onChange, fieldState } = props

    const {
      value: inputValue,
      setValue: setInputValue,
      ...places
    } = usePlacesAutocomplete({
      defaultValue: value?.description,
      requestOptions: {
        types: ['(cities)'],
      },
    })

    const options = React.useMemo(() => {
      return places.suggestions.data.map(
        ({ place_id, description, structured_formatting: { main_text, secondary_text } }) => ({
          place_id,
          description,
          structured_formatting: { main_text, secondary_text },
        })
      )
    }, [places.suggestions.data])

    const [isFetchingLatLng, setIsFetchingLatLng] = React.useState(false)

    const isLoading = React.useMemo(() => {
      return places.suggestions.loading || isFetchingLatLng
    }, [places.suggestions.loading, isFetchingLatLng])

    const isDisabled = React.useMemo(() => {
      return !places.ready || isFetchingLatLng
    }, [places.ready, isFetchingLatLng])

    const handleSelect = (place: Place) => {
      setInputValue(place.description)
      places.clearSuggestions()

      setIsFetchingLatLng(true)

      getGeocode({ address: place.description })
        .then(results => getLatLng(results[0]))
        .then(({ lat, lng }) => {
          setIsFetchingLatLng(false)

          onChange({
            ...place,
            latitude: lat,
            longitude: lng,
          })
        })
        .catch(error => {
          console.log('😱 Error: ', error)
        })
    }

    console.log(inputValue, value)

    const [isOpen, setIsOpen] = React.useState(false)

    const allowOpen = React.useMemo(() => {
      if (places.suggestions.status === 'ZERO_RESULTS') {
        return true
      }

      if (places.suggestions.data.length > 0) {
        return true
      }

      return false
    }, [places.suggestions.status, places.suggestions.data.length])

    return (
      <Autocomplete
        id='google-places-autocomplete'
        size='small'
        sx={{ mb: 2 }}
        forcePopupIcon={false}
        options={options}
        loading={false}
        open={isOpen && allowOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        clearOnEscape
        disablePortal
        clearOnBlur={false}
        openOnFocus
        disabled={isDisabled}
        getOptionLabel={option => option.description}
        filterOptions={options => options}
        isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        defaultValue={value}
        onChange={(_, newValue, reason) => {
          if (newValue && reason === 'selectOption') {
            handleSelect(newValue)
          } else if (reason === 'removeOption') {
            places.clearSuggestions()
            onChange(null)
          }
        }}
        renderOption={(props, option) => (
          <ListItem {...props} dense>
            <ListItemIcon sx={{ minWidth: 38, mr: 1, color: 'primary.main' }}>
              <PinIcon fontSize='small' sx={{ mx: 'auto' }} />
            </ListItemIcon>
            <ListItemText
              primary={option.structured_formatting.main_text}
              secondary={option.structured_formatting.secondary_text}
            />
          </ListItem>
        )}
        renderInput={params => (
          <TextField
            {...params}
            inputRef={ref}
            fullWidth
            name={name}
            label='Location'
            placeholder='Where are you eating?'
            error={Boolean(fieldState.error)}
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true,
            }}
            InputProps={{
              ...params.InputProps,
              notched: true,
              endAdornment: !Boolean(value)
                ? isLoading && <CircularProgress size={26} sx={{ p: 0.5 }} />
                : params.InputProps.endAdornment,
            }}
          />
        )}
      />
    )
  }
)

export default GooglePlaces
