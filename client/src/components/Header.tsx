/* eslint-disable import/no-anonymous-default-export */
import AppBar, { AppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

type Props = AppBarProps & {
  height?: number | string
}

export default ({ children, height, sx = [], ...props }: Props) => {
  return (
    <AppBar
      color='transparent'
      elevation={0}
      position='absolute'
      sx={[
        {
          height,
          alignItems: 'center',
          // color: t => t.palette.secondary.contrastText,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Toolbar sx={{ width: '100%', height: '100%' }}>{children}</Toolbar>
    </AppBar>
  )
}
