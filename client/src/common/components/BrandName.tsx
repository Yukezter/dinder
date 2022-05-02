/* eslint-disable import/no-anonymous-default-export */

import Link, { LinkProps } from './RouterLink'

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
