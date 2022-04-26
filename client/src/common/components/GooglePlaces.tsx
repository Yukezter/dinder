import React from 'react'
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
  getDetails,
} from 'use-places-autocomplete'
import { useAutocomplete } from '@mui/base/AutocompleteUnstyled'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import PinIcon from '@mui/icons-material/PinDrop'

import TextField from './TextField'

type OnChange = (coordinates: { lat: number; lng: number }) => void

const GooglePlaces = (props: { onChange?: OnChange }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
      types: ['(cities)'],
    },
    debounce: 300,
  })

  // React.useEffect(() => {
  //   // console.log(google)
  //   if ('geolocation' in navigator) {
  //     navigator.geolocation.getCurrentPosition(pos => {
  //       getGeocode({
  //         location: {
  //           lat: pos.coords.latitude,
  //           lng: pos.coords.latitude,
  //         },
  //       })
  //         .then(results => {
  //           // console.log(results)
  //         })
  //         .catch(error => {
  //           console.log(error)
  //         })
  //     })
  //   }
  // }, [])

  const handleInput = (newInputValue: string) => {
    // Update the keyword of the input element
    setValue(newInputValue, !!newInputValue)
  }

  const handleSelect = ({
    description,
  }: google.maps.places.AutocompletePrediction) => {
    // When user selects a place, we can replace the keyword without request data from API
    // by setting the second parameter to "false"
    setValue(description, false)
    clearSuggestions()
    console.log('description!!!!', description)
    // Get latitude and longitude via utility functions
    getGeocode({ address: description })
      .then(results => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        const coordinates = { lat, lng }
        console.log('📍 Coordinates: ', coordinates)
        if (props.onChange) {
          props.onChange(coordinates)
        }
      })
      .catch(error => {
        console.log('😱 Error: ', error)
      })
  }

  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    getClearProps,
  } = useAutocomplete({
    id: 'use-autocomplete-demo',
    inputValue: value,
    options: data,
    isOptionEqualToValue: (option, newValue) => {
      return option.place_id === newValue.place_id
    },
    getOptionLabel: option => option.description,
    filterOptions: x => x,
    onChange: (event, newValue, reason) => {
      console.log('onChange', newValue, reason)
      if (newValue) {
        console.log('handleSelect!!!')
        handleSelect(newValue)
      }
    },
    onInputChange: (event, newInputValue, reason) => {
      console.log('onInputChange', newInputValue, reason)
      handleInput(newInputValue)
      if (reason === 'clear' || reason === 'reset') {
        clearSuggestions()
      }
    },
    onClose: () => {},
  })

  const renderSuggestions = () =>
    (groupedOptions as google.maps.places.AutocompletePrediction[]).map(
      (option, index) => {
        const {
          place_id,
          structured_formatting: { main_text, secondary_text },
        } = option

        return (
          <ListItem
            key={place_id}
            dense
            disablePadding
            {...getOptionProps({ option, index })}
          >
            <ListItemButton>
              <ListItemIcon sx={{ color: theme => theme.palette.primary.main }}>
                <PinIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText primary={main_text} secondary={secondary_text} />
            </ListItemButton>
          </ListItem>
        )
      }
    )

  return (
    <Box position='relative' {...getRootProps()}>
      <TextField
        fullWidth
        sx={{ mb: 0 }}
        value={value}
        disabled={!ready}
        placeholder='Where are you eating?'
        label='Location'
        InputLabelProps={{
          shrink: true,
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end' {...getClearProps()}>
              <IconButton size='small'>
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        inputProps={{
          ...getInputProps(),
        }}
      />
      {/* We can use the "status" to decide whether we should display the dropdown or not */}
      {status === 'OK' && groupedOptions.length > 0 && (
        <Paper
          sx={theme => ({
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: theme.zIndex.modal,
          })}
        >
          <List {...getListboxProps()}>{renderSuggestions()}</List>
        </Paper>
      )}
    </Box>
  )
}

export default GooglePlaces
