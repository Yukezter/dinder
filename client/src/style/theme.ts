import { createTheme } from '@mui/material/styles'

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
    background: {
      // default: '#005579',
      default: '#fafafa',
      gradient: 'linear-gradient(#de59a9, #fa6715)',
    },
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
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root.MuiInputBase-sizeSmall': {
            paddingRight: '39px',
          },
        },
      },
    },
  },
})

export default theme

declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    gradient: string
  }

  // allow configuration using `createTheme`
  // interface ThemeOptions {
  //   background?: {
  //     gradient?: string
  //   }
  // }
}
