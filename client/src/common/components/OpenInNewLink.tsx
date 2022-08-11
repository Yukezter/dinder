import React from 'react'
import Link, { LinkProps } from '@mui/material/Link'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

const OpenInNewLink: React.FC<LinkProps> = props => {
  const { height = 40, width = 40, sx = [], ...linkProps } = props
  return (
    <Link
      target='_blank'
      display='flex'
      justifyContent='center'
      alignItems='center'
      height={height}
      width={width}
      borderRadius='50%'
      sx={[
        theme => ({
          // background: theme.palette.primary.main,
          color: theme.palette.background.paper,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...linkProps}
    >
      <OpenInNewIcon fontSize='inherit' />
    </Link>
  )
}

export default OpenInNewLink
