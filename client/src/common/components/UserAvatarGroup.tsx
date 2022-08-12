import React from 'react'
import AvatarGroup, { AvatarGroupProps } from '@mui/material/AvatarGroup'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { User } from '../../types'
import { UserAvatar } from './UserAvatar'

export interface UserAvatarGroupProps extends AvatarGroupProps {
  disablePopover?: boolean
  users?: User[]
}

export const UserAvatarGroup: React.FC<UserAvatarGroupProps> = ({
  disablePopover = false,
  users,
  max = 3,
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
        max={max}
        total={users?.length}
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
          ? Array.from(Array(max)).map((_, index) => <UserAvatar key={index} />)
          : users.slice(0, max).map(({ uid, photoURL }) => <UserAvatar key={uid} src={photoURL} />)}
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
