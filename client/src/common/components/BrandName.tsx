/* eslint-disable import/no-anonymous-default-export */
import Box from '@mui/material/Box'

import Link, { LinkProps } from './Link'

export default ({ sx = [], ...props }: LinkProps) => {
  return (
    <Link
      variant='h6'
      fontWeight={800}
      color='primary'
      underline='hover'
      display='inline-block'
      sx={[
        {
          ':hover': {
            textDecorationColor: theme => theme.palette.secondary.main,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      Dinder.
    </Link>
  )
}
