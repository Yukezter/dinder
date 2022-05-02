import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon'
import { ReactComponent as LikeIcon } from '../../assets/icons/like_icon.svg'

const Like: React.FC<SvgIconProps> = ({ style, ...props }) => (
  <SvgIcon
    component={LikeIcon}
    style={{
      height: 'inherit',
      width: 'inherit',
      ...style,
    }}
    {...props}
  />
)

export default Like
