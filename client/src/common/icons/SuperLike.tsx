import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon'
import { ReactComponent as SuperlikeIcon } from '../../assets/icons/superlike_icon.svg'

const SuperLike: React.FC<SvgIconProps> = ({ style, ...props }) => (
  <SvgIcon
    component={SuperlikeIcon}
    style={{
      height: 'inherit',
      width: 'inherit',
      ...style,
    }}
    {...props}
  />
)

export default SuperLike
