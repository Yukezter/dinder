/* eslint-disable import/no-anonymous-default-export */
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

export default ({ text }: { text: string }) => (
  <Box display='flex' mr={2} sx={{ alignItems: 'center' }}>
    <div style={{ width: '100%' }}>
      <Divider />
    </div>
    <Typography
      color='textSecondary'
      noWrap
      display='block'
      overflow='initial'
      textOverflow='initial'
      style={{ margin: '0 8px' }}
    >
      {text}
    </Typography>
    <div style={{ width: '100%' }}>
      <Divider />
    </div>
  </Box>
)
