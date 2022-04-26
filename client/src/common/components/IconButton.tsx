import React from 'react'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'

export default React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ sx = [], ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        color='inherit'
        sx={[{}, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {props.children}
      </IconButton>
    )
  }
)
