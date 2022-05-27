import React from 'react'
import { styled } from '@mui/material/styles'
import Skeleton from '@mui/material/Skeleton'
import Badge from '@mui/material/Badge'
import Avatar, { AvatarProps } from '@mui/material/Avatar'

import { usePresence } from '../../context/FirestoreContext'

const getSize = (size: CustomAvatarProps['size']) => {
  switch (size) {
    case 'small':
      return { height: 24, width: 24 }
    case 'medium':
      return { height: 40, width: 40 }
    case 'large':
      return { height: 56, width: 56 }
    default:
      return { height: size, width: size }
  }
}

const OnlineStatusBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))

interface CustomAvatarProps extends AvatarProps {
  size?: 'small' | 'medium' | 'large' | number
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  size,
  style,
  ...props
}) => (
  <Avatar
    style={{
      ...getSize(size),
      ...style,
    }}
    {...props}
  />
)

interface CustomBadgeProps extends CustomAvatarProps {
  isLoading?: boolean
  id?: string
}

const AvatarWithBadge = React.forwardRef<HTMLDivElement, CustomBadgeProps>(
  ({ isLoading, id, ...props }, ref) => {
    const { isOnline } = usePresence()
    return (
      <OnlineStatusBadge
        ref={ref}
        overlap='circular'
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant='dot'
        invisible={!isOnline(id)}
      >
        {isLoading ? (
          <Skeleton variant='circular'>
            <CustomAvatar {...props} />
          </Skeleton>
        ) : (
          <CustomAvatar {...props} />
        )}
      </OnlineStatusBadge>
    )
  }
)

export default AvatarWithBadge
