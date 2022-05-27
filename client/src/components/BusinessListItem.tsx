import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ListItem, { ListItemProps } from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Skeleton from '@mui/material/Skeleton'

import { Business, Match } from '../context/FirestoreContext'
import { Avatar, Stars, OpenInNewLink } from '../common/components'
import LikeIcon from '../common/icons/Like'
import SuperLikeIcon from '../common/icons/SuperLike'

interface BusinessListItemProps extends ListItemProps {
  isLoading?: boolean
  type?: Business['type'] | Match['type']
  details?: Business['details']
}

const BusinessListItem: React.FC<BusinessListItemProps> = ({
  isLoading,
  type,
  details,
  // secondaryAction,
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
      // secondaryAction={!isLoading && details && secondaryAction}
      {...props}
    >
      <ListItemAvatar sx={{ mr: { xs: 1, sm: 3, lg: 1 } }}>
        {isLoading || !details ? (
          <Skeleton variant='rectangular'>
            <Avatar variant='square' size={80} />
          </Skeleton>
        ) : (
          <div style={{ position: 'relative' }}>
            <Avatar src={details.image} variant='square' size={80} />
            {type === 'like' && (
              <LikeIcon
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                }}
              />
            )}
            {type === 'super-like' && (
              <SuperLikeIcon
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                }}
              />
            )}
            <OpenInNewLink
              href={details.url}
              height={24}
              width={24}
              fontSize='small'
              position='absolute'
              top={4}
              right={4}
            />
          </div>
        )}
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={
          <>
            <Box display='flex' alignItems='center'>
              {!isLoading && details && <Stars rating={details.rating} />}
              <Typography variant='caption' noWrap height={18}>
                {isLoading || !details ? (
                  <Skeleton width={80} />
                ) : (
                  details.reviews
                )}
              </Typography>
            </Box>
            <Typography
              variant='body1'
              component='div'
              noWrap
              overflow='hidden'
              textOverflow='ellipsis'
            >
              {isLoading || !details ? <Skeleton width='80%' /> : details.name}
            </Typography>
          </>
        }
        secondary={
          <Typography variant='body2' component='div'>
            {isLoading || !details ? (
              <Skeleton width='60%' />
            ) : (
              details.location
            )}
          </Typography>
        }
      />
    </ListItem>
  )
}

export default BusinessListItem
