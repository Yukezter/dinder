import { createTheme } from '@mui/material'

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1300,
      xl: 1536,
    },
  },
  palette: {
    // background: {
    //   default: '#005579',
    // },
    primary: {
      main: '#EC5500',
    },
    secondary: {
      main: '#005579',
    },
    info: {
      main: '#000',
    },
    // success: {
    //   main: '#1a73e8',
    // },
    // error: {
    //   main: '#EC5500',
    // },
  },
})

export default theme
