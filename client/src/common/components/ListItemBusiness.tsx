import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ListSubheader from '@mui/material/ListSubheader'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Link from '@mui/material/Link'

import { Business, Match } from '../../types'
import { Avatar, Stars } from '.'

export interface ListItemBusinessProps extends ListItemProps {
  isLoading?: boolean
  type?: Business['type'] | Match['type']
  details?: Business['details']
}

export const ListItemBusiness: React.FC<ListItemBusinessProps> = ({
  isLoading,
  details,
  divider,
  sx = [],
  ...props
}) => {
  return (
    <>
      <ListItem alignItems='flex-start' sx={[{}, ...(Array.isArray(sx) ? sx : [sx])]} {...props}>
        <ListItemAvatar sx={{ mr: { xs: 1, sm: 3, lg: 1 } }}>
          {isLoading || !details ? (
            <Skeleton variant='rectangular'>
              <Avatar variant='square' size={56} />
            </Skeleton>
          ) : (
            <Link
              href={details.url}
              target='_blank'
              color='text.primary'
              display='block'
              position='relative'
            >
              <Avatar src={details.image_url} variant='square' size={56} />
            </Link>
          )}
        </ListItemAvatar>
        <ListItemText
          sx={{ mr: 1 }}
          disableTypography
          primary={
            <>
              <Box display='flex' alignItems='center'>
                {!isLoading && details && <Stars rating={details.rating} />}
                <Typography variant='caption' noWrap height={18}>
                  {isLoading || !details ? <Skeleton width={80} /> : details.review_count}
                </Typography>
              </Box>
              <Link
                href={details?.url}
                target='_blank'
                color='text.primary'
                noWrap
                display='block'
                underline='hover'
              >
                {isLoading || !details ? <Skeleton width='80%' /> : details.name}
              </Link>
            </>
          }
          secondary={
            <Typography variant='body2' component='div'>
              {isLoading || !details ? (
                <Skeleton width='60%' />
              ) : (
                `${details.location.city}, ${details.location.state || details.location.country}`
              )}
            </Typography>
          }
        />
      </ListItem>
      {divider && (
        <ListSubheader disableSticky>
          <Divider variant='fullWidth' />
        </ListSubheader>
      )}
    </>
  )
}

export default ListItemBusiness
