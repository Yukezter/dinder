/* eslint-disable import/no-anonymous-default-export */
import Box from '@mui/material/Box'
import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'

import Link, { LinkProps } from './RouterLink'

export default (props: LinkProps) => {
  return (
    <Link
      variant='h6'
      fontWeight={800}
      color='white'
      underline='hover'
      display='inline-block'
      width='auto'
      mx='auto'
      {...props}
    >
      <Box display='flex' alignItems='center'>
        <span>Dinder</span>
        <LocalDiningTwoToneIcon />
      </Box>
    </Link>
  )
}
