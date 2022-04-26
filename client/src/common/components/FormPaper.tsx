import React from 'react'
import Paper, { PaperProps } from '@mui/material/Paper'

const FormPaper = React.forwardRef<HTMLDivElement, PaperProps>((props, ref) => (
  <Paper
    ref={ref}
    elevation={2}
    sx={{
      width: '100%',
      maxWidth: 350,
      p: 4,
    }}
    {...props}
  />
))

export default FormPaper

// type FormProps = React.HTMLProps<HTMLFormElement>

// type Props = PaperProps & {
//   FormProps?: FormProps
// }

// const FormPaper = React.forwardRef<HTMLDivElement, Props>(({ children, FormProps = {}, ...PaperProps }, ref) => (
//   <Paper
//     ref={ref}
//     sx={{
//       width: '100%',
//       maxWidth: 350,
//       p: 4,
//     }}
//     {...PaperProps}
//     >
//       <form {...FormProps}>
//         {children}
//       </form>
//     </Paper>
// ))
