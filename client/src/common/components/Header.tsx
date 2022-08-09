import AppBar, { AppBarProps } from '@mui/material/AppBar'
import Toolbar, { ToolbarProps } from '@mui/material/Toolbar'
import Box, { BoxProps } from '@mui/material/Box'

type HeaderProps = AppBarProps & {
  ToolbarProps?: ToolbarProps & BoxProps
}

export const Header = ({ children, sx = [], ...props }: HeaderProps) => {
  const { ToolbarProps: toolbarProps = {}, ...rootProps } = props

  return (
    <AppBar
      color='transparent'
      sx={[
        {
          alignItems: 'center',
          width: '100%',
          px: { sm: 2 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rootProps}
    >
      <Toolbar
        component={Box}
        width='100%'
        display='flex'
        justifyContent='space-between'
        {...toolbarProps}
      >
        {children}
      </Toolbar>
    </AppBar>
  )
}
