import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'
import Button, { ButtonProps } from '@mui/material/Button'

const LinkBehavior = React.forwardRef<
  any,
  Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }
>((props, ref) => {
  const { href, ...other } = props
  return <RouterLink ref={ref} to={href} {...other} />
})

type ButtonLinkProps = ButtonProps & {
  to: string
}

const ButtonLink = ({ to, sx = [], ...props }: ButtonLinkProps) => {
  return (
    <Button
      LinkComponent={LinkBehavior}
      href={to}
      variant='contained'
      color='primary'
      sx={[{ borderRadius: 6 }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...props}
    >
      {props.children}
    </Button>
  )
}

export default ButtonLink
