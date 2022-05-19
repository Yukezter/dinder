import React from 'react'
import AvatarGroup, { AvatarGroupProps } from '@mui/material/AvatarGroup'
import Avatar from '@mui/material/Avatar'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'

import { User } from '../../context/FirestoreContext'

interface CustomAvatarGroupProps extends AvatarGroupProps {
  size?: 'small' | 'medium'
  disablePopover?: boolean
  users?: User[]
}

const CustomAvatarGroup: React.FC<CustomAvatarGroupProps> = ({
  disablePopover = false,
  size = 'medium',
  users,
  ...props
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <AvatarGroup
        spacing={6}
        max={3}
        sx={{
          mr: 1,
          justifyContent: { xs: 'center', sm: 'flex-end' },
          '& > .MuiAvatarGroup-avatar': {
            ...(size === 'small' && {
              width: 24,
              height: 24,
              fontSize: theme => theme.typography.caption.fontSize,
            }),
            ...(size === 'medium' && {
              width: { xs: 24, sm: 40 },
              height: { xs: 24, sm: 40 },
            }),
          },
        }}
        {...(users &&
          !disablePopover && {
            'aria-owns': open ? 'mouse-over-popover' : undefined,
            'aria-haspopup': 'true',
            onMouseEnter: handlePopoverOpen,
            onMouseLeave: handlePopoverClose,
          })}
        {...props}
      >
        {!users
          ? Array.from(Array(3)).map((_, index) => <Avatar key={index} />)
          : users.map(({ uid, photoURL }) => (
              <Avatar key={uid} src={photoURL} />
            ))}
      </AvatarGroup>
      {users && !disablePopover && (
        <Popover
          id='mouse-over-popover'
          sx={{
            pointerEvents: 'none',
          }}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
          disableScrollLock
        >
          <Stack padding={1}>
            {users.map(({ uid, name }) => (
              <Typography key={uid} variant='caption'>
                {name}
              </Typography>
            ))}
          </Stack>
        </Popover>
      )}
    </>
  )
}

export default CustomAvatarGroup
