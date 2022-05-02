import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon'
import { ReactComponent as BlockIcon } from '../../assets/icons/block_icon.svg'

const Block: React.FC<SvgIconProps> = ({ style, ...props }) => (
  <SvgIcon
    component={BlockIcon}
    style={{
      height: 'inherit',
      width: 'inherit',
      ...style,
    }}
    {...props}
  />
)

export default Block
