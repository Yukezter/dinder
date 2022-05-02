import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon'
import { ReactComponent as DislikeIcon } from '../../assets/icons/dislike_icon.svg'

const Dislike: React.FC<SvgIconProps> = ({ style, ...props }) => (
  <SvgIcon
    component={DislikeIcon}
    style={{
      height: 'inherit',
      width: 'inherit',
      ...style,
    }}
    {...props}
  />
)

export default Dislike
