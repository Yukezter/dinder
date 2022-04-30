import React from 'react'
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
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
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import PinIcon from '@mui/icons-material/PinDrop'

import TextField from '../../common/components/TextField'
import { PopulatedParty } from '../FirestoreContext'

type OnChange = (location?: {
  place_id: string
  description: string
  latitude: number
  longitude: number
}) => void

type GooglePlacesProps = {
  location?: PopulatedParty['location']
  onChange?: OnChange
}

const GooglePlaces: React.FC<GooglePlacesProps> = React.memo(
  props => {
    const { location, onChange } = props

    const {
      ready,
      value: placesInputValue,
      suggestions: { status, data, loading },
      setValue: setPlacesInputValue,
      clearSuggestions,
    } = usePlacesAutocomplete({
      defaultValue: location?.description,
      requestOptions: {
        types: ['(cities)'],
      },
    })

    console.log(placesInputValue, location)

    const handlePlacesSelect = (
      place: google.maps.places.AutocompletePrediction
    ) => {
      setPlacesInputValue(place.description)
      clearSuggestions()

      getGeocode({ address: place.description })
        .then(results => getLatLng(results[0]))
        .then(({ lat, lng }) => {
          if (onChange) {
            onChange({
              place_id: place.place_id,
              description: place.description,
              latitude: lat,
              longitude: lng,
            })
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
      inputValue,
    } = useAutocomplete({
      id: 'use-autocomplete-demo',
      inputValue: placesInputValue,
      defaultValue: location as Pick<
        google.maps.places.AutocompletePrediction,
        'place_id' | 'description'
      >,
      options: data,
      isOptionEqualToValue: (option, newValue) => {
        return option.place_id === newValue.place_id
      },
      clearOnEscape: true,
      getOptionLabel: option => option.description,
      filterOptions: x => x,
      onChange: (event, newValue, reason) => {
        console.log('onChange', newValue, reason)
        if (newValue) {
          handlePlacesSelect(
            newValue as google.maps.places.AutocompletePrediction
          )
        }
      },
      onInputChange: (event, newInputValue, reason) => {
        console.log('onInputChange', newInputValue, reason)
        setPlacesInputValue(newInputValue, !!newInputValue)
        if (['reset', 'clear'].includes(reason)) {
          clearSuggestions()
          if (onChange) {
            onChange()
          }
        }
      },
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
                <ListItemIcon
                  sx={{ color: theme => theme.palette.primary.main }}
                >
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
          value={inputValue}
          disabled={!ready}
          placeholder='Where are you eating?'
          label='Location'
          InputLabelProps={{
            shrink: true,
            ...getInputLabelProps(),
          }}
          InputProps={{
            endAdornment: loading ? (
              <InputAdornment position='end'>
                <CircularProgress size={20} />
              </InputAdornment>
            ) : (
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
  },
  (prevProps, nextProps) => {
    return prevProps.location?.place_id === nextProps.location?.place_id
  }
)

export default GooglePlaces

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
