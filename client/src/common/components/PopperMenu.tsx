import React from 'react'
import useTheme from '@mui/material/styles/useTheme'
import Popper from '@mui/material/Popper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { MenuListProps } from '@mui/material/MenuList'
import Grow from '@mui/material/Grow'
import Box, { BoxProps } from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { IconButtonProps } from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import { IconButton } from '../../common/components'

type PopperMenuProps = BoxProps & {
  id?: string
  menuId?: string
  icon?: JSX.Element
  IconButtonProps?: IconButtonProps
  children: (props: {
    menuListProps: MenuListProps
    handleClose: (event?: Event | React.SyntheticEvent) => void
  }) => JSX.Element
}

export const PopperMenu: React.FC<PopperMenuProps> = props => {
  const { id, menuId, icon, IconButtonProps: iconButtonProps = {}, ...boxProps } = props
  const theme = useTheme()
  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = (event?: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return
    }

    setOpen(false)
  }

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current!.focus()
    }

    prevOpen.current = open
  }, [open])

  const menuListProps: MenuListProps = {
    autoFocusItem: open,
    id: menuId,
    'aria-labelledby': id,
    onKeyDown: handleListKeyDown,
    variant: 'menu',
    dense: true,
  }

  return (
    <Box {...boxProps}>
      <IconButton
        ref={anchorRef}
        id={id}
        aria-label='settings'
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleToggle}
        {...iconButtonProps}
      >
        {!icon ? <MoreVertIcon /> : icon}
      </IconButton>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement='bottom-end'
        role={undefined}
        // disablePortal
        // keepMounted
        transition
        style={{ zIndex: theme.zIndex.modal }}
      >
        {({ TransitionProps, placement }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={3}>
              <ClickAwayListener onClickAway={handleClose}>
                {props.children({
                  menuListProps,
                  handleClose,
                })}
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}
