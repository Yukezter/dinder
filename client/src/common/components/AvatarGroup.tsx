import React from 'react'
import AvatarGroup, { AvatarGroupProps } from '@mui/material/AvatarGroup'
// import Avatar from '@mui/material/Avatar'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// import Skeleton from '@mui/material/Skeleton'

import { User } from '../../types'
import Avatar from './Avatar'

interface CustomAvatarGroupProps extends AvatarGroupProps {
  disablePopover?: boolean
  users?: User[]
}

const CustomAvatarGroup: React.FC<CustomAvatarGroupProps> = ({
  disablePopover = false,
  users,
  sx = [],
  ...props
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopoverClose = () => {
    setAnchorEl(null)
  }

  const hasPopover = users && !disablePopover

  return (
    <>
      <AvatarGroup
        spacing={6}
        max={3}
        sx={[
          {
            mr: 1,
            justifyContent: 'center',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...(hasPopover && {
          'aria-owns': open ? 'avatar-group-popover' : undefined,
          'aria-haspopup': 'true',
          onMouseEnter: handlePopoverOpen,
          onMouseLeave: handlePopoverClose,
        })}
        {...props}
      >
        {!users
          ? Array.from(Array(3)).map((_, index) => <Avatar key={index} />)
          : users.map(({ uid, photoURL }) => <Avatar key={uid} src={photoURL} />)}
      </AvatarGroup>
      {hasPopover && (
        <Popover
          id='avatar-group-popover'
          sx={{ pointerEvents: 'none' }}
          open={open}
          onClose={handlePopoverClose}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
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
