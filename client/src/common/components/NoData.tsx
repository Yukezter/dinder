import Box from '@mui/material/Box'
// import Avatar from '@mui/material/Avatar'
import Stack, { StackProps } from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import Avatar from './Avatar'

type NoDataProps = StackProps & {
  icon: JSX.Element
  title: string
  description: string
  action?: JSX.Element
}

export const NoData: React.FC<NoDataProps> = ({ icon, title, description, action, ...props }) => {
  return (
    <Box minHeight={250} flex={1} display='flex' justifyContent='center' alignItems='center'>
      <Stack alignItems='center' spacing={1.5} {...props}>
        <Avatar size='large'>{icon}</Avatar>
        <div>
          <Typography
            variant='body1'
            display='block'
            align='center'
            gutterBottom
            color='text.secondary'
          >
            {title}
          </Typography>
          <Typography
            variant='caption'
            display='block'
            align='center'
            gutterBottom
            color='text.secondary'
          >
            {description}
          </Typography>
        </div>
        {action}
      </Stack>
    </Box>
  )
}
