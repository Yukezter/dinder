// import React from 'react'
// import { UserCredential } from 'firebase/auth'
// import { Link, Navigate } from 'react-router-dom'
// import { useMutation } from 'react-query'
// import { SwitchTransition } from 'react-transition-group'
// import { styled } from '@mui/material/styles'
// import Grid from '@mui/material/Grid'
// import Box from '@mui/material/Box'
// import Slide from '@mui/material/Slide'
// import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
// import ToggleButton from '@mui/material/ToggleButton'
// import Typography from '@mui/material/Typography'
// import Checkbox from '@mui/material/Checkbox'
// import FormControlLabel from '@mui/material/FormControlLabel'
// import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// import { IAuthContext } from '../../context/AuthContext'
// import { usePhoneAuth } from '../../hooks'
// import { PhoneAuthResult } from '../../hooks/usePhoneAuth'
// import landingImage from '../../assets/images/food.jpg'
// import backgroundImage from '../../assets/images/background.svg'
// import {
//   Button,
//   FormAlert,
//   TextField,
//   FlexCenter,
//   DividerText,
//   FormPaper,
// } from '../../common/components'

// const SignUp: React.FC<{ phoneAuth: PhoneAuthResult }> = ({ phoneAuth }) => {
//   const inputRef = React.useRef<HTMLInputElement>(null)
//   const [checked, setChecked] = React.useState(false)
//   const submitButtonRef = React.useRef<HTMLButtonElement>(null)

//   const mutation = useMutation<void, Error, { phoneNumber: string }>(
//     async data => {
//       return phoneAuth.signInWithPhoneNumber(data.phoneNumber)
//     }
//   )

//   const handleSubmit: React.FormEventHandler<HTMLFormElement> = e => {
//     e.preventDefault()
//     const phoneNumber = inputRef.current!.value
//     mutation.mutate({ phoneNumber })
//   }

//   const disabled = mutation.isLoading || mutation.isSuccess

//   return (
//     <>
//       <Typography variant='h4' mb={2}>
//         Sign up
//       </Typography>
//       {mutation.isError && (
//         <FormAlert message={mutation.error.message} onClose={mutation.reset} />
//       )}
//       <form onSubmit={handleSubmit}>
//         <TextField
//           inputRef={inputRef}
//           disabled={disabled}
//           id='phone-number'
//           label='Phone number'
//           fullWidth
//           sx={{ mb: 2 }}
//         />
//         <FormControlLabel
//           disabled={disabled}
//           control={
//             <Checkbox
//               checked={checked}
//               onChange={e => setChecked(e.target.checked)}
//               inputProps={{ 'aria-label': 'Agreement' }}
//             />
//           }
//           label={
//             <Typography variant='caption' ml={1}>
//               <span>I agree to the </span>
//               <Box component='span' sx={{ color: 'primary.main' }}>
//                 Terms of Service
//               </Box>
//               <span> and </span>
//               <Box component='span' sx={{ color: 'primary.main' }}>
//                 Privacy Policy
//               </Box>
//             </Typography>
//           }
//           sx={{ mb: 2 }}
//         />
//         <Button
//           type='submit'
//           ref={submitButtonRef}
//           loading={disabled}
//           disabled={!checked}
//         >
//           Get Code
//         </Button>
//       </form>
//     </>
//   )
// }

// const SignIn: React.FC<{ phoneAuth: PhoneAuthResult }> = ({ phoneAuth }) => {
//   const [username, setUsername] = React.useState('')
//   const [phoneNumber, setPhoneNumber] = React.useState('')
//   const signInButtonRef = React.useRef<HTMLButtonElement>(null)

//   const mutation = useMutation<
//     void,
//     Error,
//     { username?: string; phoneNumber?: string }
//   >(async data => {
//     if (data.username) {
//       return phoneAuth.signInWithUsername(data.username)
//     }

//     return phoneAuth.signInWithPhoneNumber(data.phoneNumber!)
//   })

//   const handleSubmit: React.FormEventHandler<HTMLFormElement> = e => {
//     e.preventDefault()
//     if (!username && !phoneNumber) return
//     mutation.mutate({ username, phoneNumber })
//   }

//   const handleUsernameChange: React.ChangeEventHandler<
//     HTMLInputElement
//   > = e => {
//     setUsername(e.target.value)
//   }

//   const handlePhoneNumberChange: React.ChangeEventHandler<
//     HTMLInputElement
//   > = e => {
//     setPhoneNumber(e.target.value)
//   }

//   const disabled = mutation.isLoading || mutation.isSuccess

//   return (
//     <>
//       <Typography variant='h4' mb={2}>
//         Sign in
//       </Typography>
//       {mutation.isError && (
//         <FormAlert message={mutation.error.message} onClose={mutation.reset} />
//       )}
//       <form onSubmit={handleSubmit}>
//         <TextField
//           id='username'
//           label='Username'
//           fullWidth
//           sx={{ mb: 0 }}
//           value={username}
//           onChange={handleUsernameChange}
//           disabled={!!phoneNumber || disabled}
//         />
//         <DividerText text='or' />
//         <TextField
//           id='phone-number'
//           label='Phone number'
//           fullWidth
//           sx={{ mb: 3 }}
//           value={phoneNumber}
//           onChange={handlePhoneNumberChange}
//           disabled={!!username || disabled}
//         />
//         <Button
//           type='submit'
//           ref={signInButtonRef}
//           loading={disabled}
//           disabled={!username && !phoneNumber}
//         >
//           Get Code
//         </Button>
//       </form>
//     </>
//   )
// }

// const AuthForm: React.FC<{ phoneAuth: PhoneAuthResult }> = ({ phoneAuth }) => {
//   const [formType, setFormType] = React.useState<0 | 1>(1)

//   const handleChange = (e: any, value: 0 | 1) => {
//     if (value !== null) {
//       setFormType(value)
//     }
//   }

//   return (
//     <>
//       <FlexCenter>
//         <ToggleButtonGroup
//           color='primary'
//           value={formType}
//           exclusive
//           size='small'
//           onChange={handleChange}
//           sx={{ mb: 2 }}
//         >
//           <ToggleButton value={0}>Sign Up</ToggleButton>
//           <ToggleButton value={1}>Sign In</ToggleButton>
//         </ToggleButtonGroup>
//       </FlexCenter>
//       {formType === 0 && <SignUp phoneAuth={phoneAuth} />}
//       {formType === 1 && <SignIn phoneAuth={phoneAuth} />}
//     </>
//   )
// }

// type ConfirmCodeFormProps = {
//   auth: IAuthContext
//   phoneAuth: PhoneAuthResult
// }

// const ConfirmCodeForm = ({ phoneAuth }: ConfirmCodeFormProps) => {
//   const inputRef = React.useRef<HTMLInputElement>()
//   const checkboxRef = React.useRef<HTMLInputElement>(null)
//   const submitButtonRef = React.useRef<HTMLButtonElement>(null)

//   const mutation = useMutation<
//     UserCredential,
//     Error,
//     { code: string; persistenceType: 'LOCAL' | 'SESSION' }
//   >(async data => {
//     return phoneAuth.confirmCode(data.code, data.persistenceType)
//   })

//   const handleSubmitCode: React.FormEventHandler<HTMLFormElement> = e => {
//     e.preventDefault()
//     const code = inputRef.current!.value
//     const checked = checkboxRef.current!.value
//     const persistenceType = checked ? 'LOCAL' : 'SESSION'
//     mutation.mutate({ code, persistenceType })
//   }

//   const disabled = mutation.isLoading || mutation.isSuccess

//   return (
//     <>
//       <Button
//         sx={{
//           mb: 1,
//           color: 'text.primary',
//           ':hover': {
//             backgroundColor: 'transparent',
//           },
//         }}
//         fullWidth={false}
//         variant='text'
//         startIcon={<ArrowBackIcon />}
//         onClick={phoneAuth.reset}
//         disabled={disabled}
//       >
//         Back
//       </Button>
//       <Typography variant='h4' mb={2}>
//         Enter code
//       </Typography>
//       {mutation.isError && (
//         <FormAlert message={mutation.error.message} onClose={mutation.reset} />
//       )}
//       <form onSubmit={handleSubmitCode}>
//         <TextField
//           inputRef={inputRef}
//           disabled={disabled}
//           id='verification-code'
//           label='Code'
//           focused={true}
//           fullWidth
//           sx={{ mb: 1 }}
//         />
//         <FormControlLabel
//           disabled={disabled}
//           labelPlacement='start'
//           control={
//             <Checkbox
//               inputRef={checkboxRef}
//               inputProps={{ 'aria-label': 'Agreement' }}
//               size='small'
//             />
//           }
//           label={<Typography variant='caption'>Remember me?</Typography>}
//           sx={{ ml: 0, mb: 1, justifyContent: 'space-between', width: '100%' }}
//         />
//         <Button type='submit' loading={disabled}>
//           Verify
//         </Button>
//         {!phoneAuth.state?.resentCode && (
//           <Typography display='block' variant='caption' py={1}>
//             <span>Didn't recieve a code?&nbsp;</span>
//             <Box
//               ref={submitButtonRef}
//               component='span'
//               role='button'
//               onClick={phoneAuth.resendCode}
//               sx={{
//                 color: 'primary.main',
//                 ':hover': { cursor: 'pointer' },
//               }}
//             >
//               Request again
//             </Box>
//           </Typography>
//         )}
//       </form>
//     </>
//   )
// }

// const RootGrid = styled(Grid)(({ theme }) => ({
//   height: '100vh',
//   backgroundImage: `url(${backgroundImage})`,
//   backgroundSize: 'cover',
//   backgroundPosition: 'right',
//   '& > div': {
//     height: '100vh',
//   },
// }))

// const LandingImg = styled('img')(({ theme }) => ({
//   height: '100%',
//   width: '100%',
//   objectFit: 'cover',
//   position: 'relative',
//   '::after': {
//     content: '""',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     width: '100%',
//     background: 'rgba(0,0,0,0.3)',
//   },
// }))

// const Landing = ({ auth }: { auth: IAuthContext }) => {
//   const recaptchaContainerRef = React.useRef<HTMLInputElement>(null)
//   const phoneAuth = usePhoneAuth(recaptchaContainerRef)

//   if (auth.claims?.status) {
//     return <Navigate to='/dashboard' replace />
//   }

//   return (
//     <Box minHeight='100vh' display='flex' overflow='hidden'>
//       <div ref={recaptchaContainerRef} />
//       <RootGrid container>
//         <Grid item xs md={5}>
//           <LandingImg src={landingImage} alt='' />
//         </Grid>
//         <Grid item xs={12} md={7} container>
//           <Box m='auto'>
//             <SwitchTransition>
//               {/* @ts-ignore */}
//               <Slide key={phoneAuth.state}>
//                 <FormPaper>
//                   {!phoneAuth.state ? (
//                     <AuthForm phoneAuth={phoneAuth} />
//                   ) : (
//                     <ConfirmCodeForm auth={auth} phoneAuth={phoneAuth} />
//                   )}
//                 </FormPaper>
//               </Slide>
//             </SwitchTransition>
//           </Box>
//         </Grid>
//       </RootGrid>
//     </Box>
//   )
// }

// export default Landing

// // if (postfix.length > 3) {
// //   let newPostfix = ''
// //   postfix
// //     .split('')
// //     .filter(char => char !== '-')
// //     .forEach((number, index) => {
// //       if (index !== 0 && index % 3 === 0) {
// //         newPostfix += '-'
// //       }

// //       newPostfix += number
// //     })
// //   postfix = newPostfix
// // }

// // const prefix = '+1'
// // let { value } = e.target
// //     if (value) {
// //       let postfix = value.startsWith(prefix.substring(0, value.length))
// //         ? value.substring(prefix.length)
// //         : value

// //       setPhoneNumber(postfix.length ? `${prefix}${postfix}` : '')
// //     }

export {}
