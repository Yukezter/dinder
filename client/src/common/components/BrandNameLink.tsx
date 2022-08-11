import LocalDiningTwoToneIcon from '@mui/icons-material/LocalDiningTwoTone'

import Link, { LinkProps } from './RouterLink'

export const BrandNameLink = ({ to = '/dashboard', ...props }: Partial<LinkProps>) => {
  return (
    <Link
      to={to}
      variant='h6'
      fontWeight={800}
      underline='hover'
      width='auto'
      display='flex'
      justifyContent='center'
      alignItems='center'
      lineHeight={1}
      {...props}
    >
      <span>Dinder</span>
      <LocalDiningTwoToneIcon sx={{ ml: 0.25 }} />
    </Link>
  )
}
