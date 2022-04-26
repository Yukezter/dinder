import React from 'react'
import MuiTextField, { TextFieldProps } from '@mui/material/TextField'

const TextField = React.forwardRef<HTMLDivElement, TextFieldProps>(
  (props, ref) => {
    return (
      <MuiTextField
        ref={ref}
        size='small'
        sx={{ mb: 2 }}
        variant='outlined'
        {...props}
      />
    )
  }
)

export default TextField
