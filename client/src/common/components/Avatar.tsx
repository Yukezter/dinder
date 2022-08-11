import React from 'react'
import MuiAvatar, { AvatarProps as MuiAvatarProps } from '@mui/material/Avatar'

export interface AvatarProps extends MuiAvatarProps {
  size?: 'small' | 'medium' | 'large' | number
}

const getSize = (size: AvatarProps['size']) => {
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

export const Avatar: React.FC<AvatarProps> = ({ size, style, ...props }) => (
  <MuiAvatar
    style={{
      ...getSize(size),
      ...style,
    }}
    {...props}
  />
)

export default Avatar
