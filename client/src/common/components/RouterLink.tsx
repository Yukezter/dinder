import React from 'react'
import {
  useResolvedPath,
  useMatch,
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom'
import { SxProps, Theme } from '@mui/material'
import Link, { LinkProps as MuiLinkProps } from '@mui/material/Link'

const LinkBehavior = React.forwardRef<
  any,
  Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
  const { href, ...other } = props
  return <RouterLink ref={ref} to={href} {...other} />
})

export type LinkProps = MuiLinkProps &
  RouterLinkProps & {
    to: string
    activeSx?: SxProps<Theme>
  }

export default React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, sx = [], activeSx = [], ...props }, ref) => {
    // const resolved = useResolvedPath(to)
    // const match = useMatch({ path: resolved.pathname, end: true })

    // if (match) {
    //   allSx.push(...(Array.isArray(activeSx) ? activeSx : [activeSx]))
    // }

    return (
      <Link
        ref={ref}
        href={to}
        component={LinkBehavior}
        color='inherit'
        underline='none'
        display='flex'
        width='100%'
        alignItems='center'
        sx={Array.isArray(sx) ? sx : [sx]}
        {...props}
      />
    )
  }
)
