import React from 'react'
import { GoogleMap, Circle, Marker } from '@react-google-maps/api'
import useTheme from '@mui/material/styles/useTheme'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

import { PopulatedParty, BusinessData } from '../../types'
import { useUser, useUIContext } from '../../context'
import { IconButton, UserAvatar } from '../../common/components'

type MembersProps = {
  members: PopulatedParty['members']
}

const Members: React.FC<MembersProps> = ({ members }) => {
  const user = useUser()
  const ui = useUIContext()

  return (
    <Stack
      direction='row'
      spacing={1}
      pb={0.25}
      sx={{
        overflowX: 'auto',
        /* Hide scrollbar for Chrome, Safari and Opera */
        '::-webkit-scrollbar': {
          display: 'none',
        },
        /* Hide scrollbar for IE, Edge and Firefox */
        msOverflowStyle: 'none' /* IE and Edge */,
        scrollbarWidth: 'none' /* Firefox */,
      }}
    >
      {members
        .filter(member => user.uid !== member.uid)
        // .reduce<User[]>((acc, curr) => acc.concat(new Array<User>(20).fill(curr)), [])
        .map(member => (
          <IconButton key={member.uid} sx={{ p: 0 }} onClick={() => ui.profile.open(member)}>
            <UserAvatar
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
        ))}
    </Stack>
  )
}

type PartyInfoProps = {
  party: PopulatedParty
  currentBusiness?: BusinessData
}

const containerStyle = {
  width: '100%',
  height: '100%',
}

export const PartyInfo: React.FC<PartyInfoProps> = React.memo(({ party, currentBusiness }) => {
  const theme = useTheme()
  const [map, setMap] = React.useState<google.maps.Map | null>(null)
  // const [marker, setMarker] = React.useState<google.maps.Marker | null>(null)

  const center = React.useMemo(
    () => ({
      lat: party.location.latitude,
      lng: party.location.longitude,
    }),
    [party.location.latitude, party.location.longitude]
  )

  const businessCenter = React.useMemo(() => {
    if (currentBusiness) {
      return {
        lat: currentBusiness.coordinates.latitude,
        lng: currentBusiness.coordinates.longitude,
      }
    }
  }, [currentBusiness])

  const infoWindow = React.useMemo(() => {
    return new google.maps.InfoWindow()
  }, [])

  // const marker = React.useMemo(() => {
  //   return new google.maps.Marker({
  //     map: map,
  //     // position: {
  //     //   lat: currentBusiness.coordinates.latitude,
  //     //   lng: currentBusiness.coordinates.longitude,
  //     // },
  //     icon: {
  //       path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  //       fillColor: theme.palette.primary.main,
  //       fillOpacity: 0.8,
  //       strokeColor: theme.palette.primary.main,
  //       scale: 1.5,
  //     },
  //   })
  // }, [])

  const onLoadMap = React.useCallback((map: google.maps.Map) => {
    // const circle = new window.google.maps.Circle({
    //   strokeColor: theme.palette.primary.main,
    //   strokeOpacity: 0.8,
    //   strokeWeight: 2,
    //   fillColor: theme.palette.primary.main,
    //   fillOpacity: 0.15,
    //   clickable: false,
    //   draggable: false,
    //   editable: false,
    //   visible: true,
    //   zIndex: 1,
    // })

    // circle.setRadius(party.params.radius * 1609.34)
    // circle.setCenter(center)

    // const bounds = circle.getBounds()
    // if (bounds) {
    //   map.fitBounds(bounds, 0)
    //   setMap(map)
    // }

    // setMarker(
    //   new google.maps.Marker({
    //     map: map,
    //     icon: {
    //       path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    //       fillColor: theme.palette.primary.main,
    //       fillOpacity: 0.8,
    //       strokeColor: theme.palette.primary.main,
    //       scale: 1.5,
    //     },
    //   })
    // )

    setMap(map)
  }, [])

  const onUnmount = React.useCallback((map: google.maps.Map) => {
    setMap(null)
  }, [])

  // React.useEffect(() => {
  //   if (map) {

  //   }
  // }, [map, party])

  // React.useEffect(() => {
  //   if (map && marker && currentBusiness) {
  //     const listener = google.maps.event.addListener(marker, 'click', () => {
  //       infoWindow.setContent(currentBusiness.name)
  //       infoWindow.open(map, marker)
  //     })

  //     marker.setPosition({
  //       lat: currentBusiness.coordinates.latitude,
  //       lng: currentBusiness.coordinates.longitude,
  //     })

  //     return () => {
  //       google.maps.event.removeListener(listener)
  //       marker.setPosition(null)
  //     }
  //   }
  // }, [map, marker, currentBusiness])

  const markerRef = React.useRef<Marker | null>(null)

  return (
    <Stack flex={1} spacing={2}>
      <div>
        <Members members={party.members} />
      </div>
      <div>
        <Box display='flex' alignItems='center'>
          <Typography>{party.location.description}</Typography>
          <span style={{ marginLeft: 8, marginRight: 8 }}> &#x2022; </span>
          <Typography color='primary' fontWeight={600}>
            {'$'.repeat(party.params.price)}
          </Typography>
        </Box>
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={businessCenter || center}
          zoom={11}
          onLoad={onLoadMap}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            zoomControl: false,
            fullscreenControl: false,
          }}
        >
          <Circle
            center={center}
            radius={party.params.radius * 1609.34}
            options={{
              strokeColor: theme.palette.primary.main,
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: theme.palette.primary.main,
              fillOpacity: 0.15,
              clickable: false,
              draggable: false,
              editable: false,
              visible: true,
              zIndex: 1,
            }}
          />
          <Marker
            position={center}
            clickable={false}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: theme.palette.primary.main,
              fillOpacity: 1,
              strokeColor: theme.palette.primary.dark,
              scale: 3,
            }}
          />
          {currentBusiness && (
            <Marker
              ref={markerRef}
              position={{
                lat: currentBusiness.coordinates.latitude,
                lng: currentBusiness.coordinates.longitude,
              }}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: theme.palette.primary.main,
                fillOpacity: 0.8,
                strokeColor: theme.palette.primary.main,
                scale: 1.5,
              }}
              onClick={() => {
                infoWindow.setContent(currentBusiness.name)
                infoWindow.open(map, markerRef.current?.marker)
              }}
            />
          )}
        </GoogleMap>
      </div>
    </Stack>
  )
})
