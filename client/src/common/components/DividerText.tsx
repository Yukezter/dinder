/* eslint-disable import/no-anonymous-default-export */
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

export default ({ text }: { text: string }) => (
  <Box display='flex' alignItems='center'>
    <div style={{ flex: 1 }}>
      <Divider />
    </div>
    <Typography color='textSecondary' noWrap display='block' mx={1}>
      {text}
    </Typography>
    <div style={{ flex: 1 }}>
      <Divider />
    </div>
  </Box>
)
