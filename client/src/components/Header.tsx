/* eslint-disable import/no-anonymous-default-export */
import AppBar, { AppBarProps } from '@mui/material/AppBar'

type Props = AppBarProps

export default ({ children, sx = [], ...props }: Props) => {
  return (
    <AppBar
      color='transparent'
      sx={[
        {
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </AppBar>
  )
}
