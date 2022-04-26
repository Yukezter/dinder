import React from 'react'
// import Button, { ButtonProps } from '@mui/material/Button'
import LoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'

export default React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ sx = [], ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        variant='contained'
        color='primary'
        sx={[{ borderRadius: 6 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {props.children}
      </LoadingButton>
    )
  }
)
