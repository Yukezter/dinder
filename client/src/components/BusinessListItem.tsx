import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Skeleton from '@mui/material/Skeleton'

import { Business } from '../context/FirestoreContext'
import { Avatar, Stars } from '../common/components'

interface BusinessListItemProps extends ListItemProps {
  business?: Business['business']
}

const BusinessListItem: React.FC<BusinessListItemProps> = ({
  business,
  sx = [],
  ...props
}) => {
  return (
    <ListItem
      disableGutters
      alignItems='flex-start'
      sx={[
        {
          '& .MuiListItemSecondaryAction-root': {
            top: 16,
            transform: 'none',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <ListItemAvatar sx={{ mr: { xs: 1, sm: 3, lg: 1 } }}>
        {!business ? (
          <Skeleton variant='rectangular'>
            <Avatar variant='square' size={80} />
          </Skeleton>
        ) : (
          <Avatar src={business.image} variant='square' size={80} />
        )}
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={
          <>
            <Box display='flex' alignItems='center'>
              {business && <Stars rating={business.rating} />}
              <Typography variant='caption' noWrap height={18}>
                {!business ? <Skeleton width={80} /> : business.reviews}
              </Typography>
            </Box>
            <Typography variant='body1' component='div'>
              {!business ? <Skeleton width='80%' /> : business.name}
            </Typography>
          </>
        }
        secondary={
          <Typography variant='body2' component='div'>
            {!business ? <Skeleton width='60%' /> : business.location}
          </Typography>
        }
      />
    </ListItem>
  )
}

export default BusinessListItem
