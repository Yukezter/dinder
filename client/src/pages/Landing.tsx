import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ButtonLink } from '../common/components'

export const Landing = () => {
  const [text, setText] = React.useState('')
  const charIndex = React.useRef(1)
  const [isDone, setIsDone] = React.useState(false)

  React.useEffect(() => {
    const allText = 'Discover eateries faster than ever...'

    const tick = () => {
      if (charIndex.current <= allText.length) {
        setText(allText.slice(0, charIndex.current))
        ++charIndex.current
        const delta = 60 - Math.random() * 40
        setTimeout(() => {
          tick()
        }, delta)
      } else {
        setIsDone(true)
      }
    }

    tick()
  }, [])

  return (
    <Box
      m='auto'
      color={theme => theme.palette.getContrastText(theme.palette.primary.main)}
      display='inline'
    >
      <Typography
        variant='h3'
        color='inherit'
        fontWeight={700}
        gutterBottom
        maxWidth={{ xs: 400, md: 600 }}
      >
        {text}
        <Box
          component='span'
          sx={{
            borderRight: '1px solid white',
            ...(isDone && {
              animation: 'blink 0.8s steps(5, start) infinite',
            }),
            '@keyframes blink': {
              to: { visibility: 'hidden' },
            },
          }}
        />
      </Typography>
      <Box
        sx={{
          opacity: 0,
          ...(isDone && {
            animation: 'show 200ms forwards',
          }),
          '@keyframes show': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        <Typography component='div' variant='body1' color='inherit' mb={4}>
          Invite friends, swipe through restaurants, and match!
        </Typography>
        <Box display='flex'>
          <ButtonLink
            to='/signup'
            size='large'
            sx={theme => ({
              width: { xs: '100%', sm: 'auto' },
              color: 'primary.main',
              bgcolor: theme.palette.getContrastText(theme.palette.primary.main),
              mr: 2,
              px: 4,
            })}
          >
            Sign Up
          </ButtonLink>
          <ButtonLink
            to='/login'
            size='large'
            variant='outlined'
            sx={theme => ({
              width: { xs: '100%', sm: 'auto' },
              color: theme.palette.getContrastText(theme.palette.primary.main),
              borderColor: theme.palette.getContrastText(theme.palette.primary.main),
              px: 4,
            })}
          >
            Log In
          </ButtonLink>
        </Box>
      </Box>
    </Box>
  )
}

// const AuthForm: React.FC = () => {
//   const [formType, setFormType] = React.useState<0 | 1>(0)

//   const handleChange = (e: any, value: 0 | 1) => {
//     if (value !== null) {
//       setFormType(value)
//     }
//   }

//   return (
//     <>
//       <Box height='100%' display='flex' justifyContent='center' alignItems='center'>
//         <ToggleButtonGroup
//           color='primary'
//           value={formType}
//           exclusive
//           size='small'
//           onChange={handleChange}
//           sx={{ mb: 2.5 }}
//         >
//           <ToggleButton value={0}>Sign Up</ToggleButton>
//           <ToggleButton value={1}>Sign In</ToggleButton>
//         </ToggleButtonGroup>
//       </Box>
//       {formType === 0 && <SignUp />}
//       {formType === 1 && <SignIn />}
//     </>
//   )
// }
