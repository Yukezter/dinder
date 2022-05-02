import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon'
import { ReactComponent as FavoriteIcon } from '../../assets/icons/favorite_icon.svg'

const Favorite: React.FC<SvgIconProps> = ({ style, ...props }) => (
  <SvgIcon
    component={FavoriteIcon}
    style={{
      height: 'inherit',
      width: 'inherit',
      ...style,
    }}
    {...props}
  />
)

export default Favorite
