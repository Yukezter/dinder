import React from 'react'
import {
  useResolvedPath,
  useMatch,
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom'
import { SxProps, Theme } from '@mui/material'
import Link, { LinkProps as MuiLinkProps } from '@mui/material/Link'

export type LinkProps = MuiLinkProps &
  RouterLinkProps & {
    activeSx?: SxProps<Theme>
  }

export default React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, sx = [], activeSx = [], ...props }, ref) => {
    // const resolved = useResolvedPath(to)
    // const match = useMatch({ path: resolved.pathname, end: true })

    const allSx = [...(Array.isArray(sx) ? sx : [sx])]
    // if (match) {
    //   allSx.push(...(Array.isArray(activeSx) ? activeSx : [activeSx]))
    // }

    return (
      <Link
        ref={ref}
        component={RouterLink}
        color='inherit'
        underline='none'
        display='flex'
        width='100%'
        alignItems='center'
        to={to}
        sx={allSx}
        {...props}
      />
    )
  }
)
