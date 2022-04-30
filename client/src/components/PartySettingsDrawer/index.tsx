// import React from 'react'
// import { doc, Timestamp } from 'firebase/firestore'
// import throttle from 'lodash.throttle'
// import update from 'immutability-helper'
// import { useMutation, useQueryClient } from 'react-query'
// import Drawer, { DrawerProps } from '@mui/material/Drawer'
// import Box from '@mui/material/Box'
// import Stack from '@mui/material/Stack'
// import Grid from '@mui/material/Grid'
// import Typography from '@mui/material/Typography'
// import Slider from '@mui/material/Slider'
// import Chip from '@mui/material/Chip'
// import EatIcon from '@mui/icons-material/Restaurant'

// import { usersService } from '../../services'
// import {
//   useUser,
//   useParties,
//   User,
//   Party,
//   PopulatedParty,
// } from '../../context/FirestoreContext'
// import {
//   GooglePlaces,
//   ContactSelect,
//   Button,
//   TextField,
// } from '../../common/components'

// type OnChangeDistanceSlider = (value: number) => void

// type DistanceSliderProps = {
//   radius?: number
//   onChange?: OnChangeDistanceSlider
// }

// const DistanceSlider = React.memo(
//   ({ radius = 20, onChange }: DistanceSliderProps) => {
//     const [value, setValue] = React.useState<
//       number | string | Array<number | string>
//     >(radius)
//     console.log('DistanceSlider')

//     // React.useEffect(() => {
//     //   setValue(radius)
//     // }, [radius])

//     const handleSliderChange = React.useCallback(
//       throttle((event: Event, newValue: number | number[]) => {
//         setValue(newValue)
//       }, 50),
//       [setValue]
//     )

//     const handleSliderCommit = React.useCallback(
//       (
//         event: Event | React.SyntheticEvent<Element, Event>,
//         value: number | number[]
//       ) => {
//         if (onChange) {
//           onChange(value as number)
//         }
//       },
//       [onChange]
//     )

//     return (
//       <Box>
//         <Typography component='div' variant='body1'>
//           Distance
//         </Typography>
//         <Typography component='div' variant='body2' align='right'>
//           {value} miles
//         </Typography>
//         <Slider
//           min={10}
//           max={25}
//           value={typeof value === 'number' ? value : 0}
//           onChange={handleSliderChange}
//           onChangeCommitted={handleSliderCommit}
//           aria-label='Distance from location'
//         />
//       </Box>
//     )
//   }
// )

// type OnChangePrice = (value: number) => void

// const PriceRange = React.memo(
//   ({ price = 2, onChange }: { price?: number; onChange?: OnChangePrice }) => {
//     const [value, setValue] = React.useState(price)

//     const handlePriceRangeChange = (priceLevel: number) => () => {
//       setValue(priceLevel)
//       if (onChange) {
//         onChange(value)
//       }
//     }
//     console.log('PriceRange')

//     return (
//       <Box>
//         <Typography component='div' variant='body1' mb={1}>
//           Price
//         </Typography>
//         <Box display='flex' mb={1}>
//           {Array.from(Array(4)).map((_, index) => {
//             const priceLevel = index + 1
//             return (
//               <Chip
//                 key={index}
//                 label={'$'.repeat(priceLevel)}
//                 color='primary'
//                 variant={value >= priceLevel ? 'filled' : 'outlined'}
//                 onClick={handlePriceRangeChange(priceLevel)}
//                 sx={{ width: 60, mr: 1 }}
//               />
//             )
//           })}
//         </Box>
//       </Box>
//     )
//   }
// )

// const categoryTypes = [
//   { title: 'Breakfast', identifier: 'breakfast_brunch' },
//   { title: 'American', identifier: 'tradamerican' },
//   { title: 'Asian', identifier: 'asianfusion,chinese,vietnamese,japanese' },
//   { title: 'Fast Food', identifier: 'hotdogs' },
//   { title: 'Indian', identifier: 'indian' },
//   { title: 'Italian', identifier: 'italian' },
//   { title: 'Mexican', identifier: 'mexican' },
//   { title: 'Seafood', identifier: 'seafood' },
//   { title: 'Vegan', identifier: 'vegan' },
//   { title: 'Vegetarian', identifier: 'vegetarian' },
//   { title: 'Dessert', identifier: 'dessert' },
// ]

// type CategoriesProps = {
//   identifiers?: string[]
//   onChange?: (identifiers: string[]) => void
// }

// const Categories: React.FC<CategoriesProps> = React.memo(
//   ({ identifiers = [], onChange }) => {
//     const [categories, setCategories] = React.useState<string[]>(() => {
//       return identifiers
//         ? identifiers.map(data => {
//             const cat = categoryTypes.find(cat => cat.identifier === data)!
//             return cat.title
//           })
//         : []
//     })
//     console.log('Categories')
//     const handleCategoryChange = (title: string) => () => {
//       let newCategories: string[]
//       if (!categories.includes(title)) {
//         newCategories = [...categories.concat(title)]
//         setCategories(newCategories)
//       } else {
//         newCategories = categories.filter(category => category !== title)
//         setCategories(newCategories)
//       }

//       if (onChange) {
//         onChange(
//           newCategories.map(category => {
//             const cat = categoryTypes.find(type => type.title === category)!
//             return cat.identifier
//           })
//         )
//       }
//     }

//     return (
//       <Box>
//         <Typography component='div' variant='body1' mb={2}>
//           Categories
//         </Typography>
//         <Grid container spacing={1}>
//           {categoryTypes.map(({ title, identifier }) => {
//             const isSelected = categories.includes(title)
//             return (
//               <Grid key={title} item xs='auto'>
//                 <Chip
//                   label={title}
//                   color='primary'
//                   variant={isSelected ? 'filled' : 'outlined'}
//                   onClick={handleCategoryChange(title)}
//                   sx={{
//                     width: '100%',
//                     ...(isSelected && {
//                       border: '1px solid transparent',
//                     }),
//                   }}
//                 />
//               </Grid>
//             )
//           })}
//         </Grid>
//       </Box>
//     )
//   }
// )

// const useUpdateParty = () => {
//   const queryClient = useQueryClient()
//   return useMutation<PopulatedParty, unknown, Party>(
//     async (data: Party) => {
//       await usersService.updateParty(data)
//       const members = await usersService.getUsers(data.members)
//       return {
//         ...data,
//         members: members.docs.map(member => member.data()),
//       }
//     },
//     {
//       async onSuccess(newParty) {
//         queryClient.setQueryData<PopulatedParty[]>(
//           'parties',
//           (oldParties = []) => {
//             if (oldParties.some(oldParty => oldParty.id === newParty.id)) {
//               return [...oldParties]
//             }
//             return [...oldParties, newParty]
//           }
//         )
//       },
//     }
//   )
// }

// type PartySettings = Omit<Partial<Party>, 'settings'> & {
//   settings?: Partial<Party['settings']>
// }

// interface CreatePartyDrawerProps {
//   open: boolean
//   handleClose: () => void
//   party?: PopulatedParty
//   onSuccess?: (newSettings: PopulatedParty) => void
// }

// const PartySettingsProvider: React.FC<CreatePartyDrawerProps> = props => {
//   const { party, open, handleClose, onSuccess } = props
//   const user = useUser()
//   const updateParty = useUpdateParty()

//   const [partySettings, setPartySettings] = React.useState<PartySettings>({
//     name: '',
//     settings: {
//       radius: 20,
//       price: 2,
//       categories: [],
//     },
//     ...party,
//     admin: user.uid,
//     members: party && party.members ? party.members.map(({ uid }) => uid) : [],
//   })

//   const id = React.useMemo(() => {
//     return party?.id || doc(usersService.collections.parties.ref).id
//   }, [party?.id])

//   const handleUpdateParty = () => {
//     updateParty.mutate(
//       {
//         createdAt: Timestamp.now(),
//         ...partySettings,
//         id,
//         lastActive: Timestamp.now(),
//       } as Party,
//       {
//         onSuccess(newParty) {
//           if (onSuccess) {
//             onSuccess(newParty)
//           }

//           handleClose()
//         },
//         onError(error) {
//           console.log(error)
//         },
//         onSettled() {},
//       }
//     )
//   }

//   const updateSettings = (data: PartySettings) => {
//     setPartySettings(prev => ({
//       ...prev,
//       ...data,
//       settings: {
//         ...prev.settings,
//         ...data.settings,
//       },
//     }))
//   }

//   console.log('wowowwowowwww')

//   React.useEffect(() => {
//     console.log('wowow')
//     if (open) {
//       updateSettings({
//         name: '',
//         settings: {
//           radius: 20,
//           price: 2,
//           categories: [],
//         },
//         ...party,
//         admin: user.uid,
//         members:
//           party && party.members ? party.members.map(({ uid }) => uid) : [],
//       })
//     }
//   }, [open, party, user.uid])

//   const handleOnChangeName = React.useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       updateSettings({
//         name: e.target.value,
//       })
//     },
//     []
//   )

//   const handleOnChangeContacts = React.useCallback(
//     (contacts: User[]) => {
//       updateSettings({
//         members: [
//           ...contacts
//             .map(contact => contact.uid)
//             .filter(uid => uid !== user.uid),
//           user.uid,
//         ],
//       })
//     },
//     [user.uid]
//   )

//   const handleOnChangeLocation = React.useCallback(
//     (
//       description: string,
//       coordinates: {
//         lat: number
//         lng: number
//       }
//     ) => {
//       updateSettings({
//         settings: {
//           placesDescription: description,
//           latitude: coordinates.lat,
//           longitude: coordinates.lng,
//         },
//       })
//     },
//     []
//   )

//   const handleOnChangeRadius: OnChangeDistanceSlider = React.useCallback(
//     radius => {
//       updateSettings({
//         settings: { radius },
//       })
//     },
//     []
//   )

//   const handleOnChangePrice: OnChangePrice = React.useCallback(price => {
//     updateSettings({ settings: { price } })
//   }, [])

//   const handleOnChangeCategories = React.useCallback((categories: string[]) => {
//     updateSettings({ settings: { categories } })
//   }, [])

//   const onClose = () => {
//     if (!updateParty.isLoading) {
//       handleClose()
//     }
//   }

//   console.log(partySettings)

//   return (
//     <Drawer
//       open={open}
//       onClose={onClose}
//       keepMounted
//       anchor='right'
//       variant='temporary'
//     >
//       <Stack width={{ xs: 320, md: 400 }} p={4} spacing={3}>
//         <Typography variant='h6'>Create a party!</Typography>
//         <Stack spacing={2}>
//           <TextField
//             fullWidth
//             sx={{ mb: 0 }}
//             placeholder='Name your party!'
//             // defaultValue={partySettings?.name}
//             value={partySettings?.name}
//             onChange={handleOnChangeName}
//             label='Party Name'
//             InputLabelProps={{
//               shrink: true,
//             }}
//           />
//           <ContactSelect
//             selected={partySettings?.members}
//             onChange={handleOnChangeContacts}
//           />
//           <GooglePlaces
//             description={partySettings?.settings?.placesDescription}
//             onChange={handleOnChangeLocation}
//           />
//           <DistanceSlider
//             radius={partySettings?.settings?.radius}
//             onChange={handleOnChangeRadius}
//           />
//           <PriceRange
//             price={partySettings?.settings?.price}
//             onChange={handleOnChangePrice}
//           />
//           <Categories
//             identifiers={partySettings?.settings?.categories}
//             onChange={handleOnChangeCategories}
//           />
//         </Stack>
//         <Button onClick={handleUpdateParty} loading={updateParty.isLoading}>
//           Create Party
//         </Button>
//       </Stack>
//     </Drawer>
//   )
// }

// export default PartySettingsProvider

export {}
