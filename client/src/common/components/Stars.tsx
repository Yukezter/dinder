import React from 'react'
import Box from '@mui/material/Box'
import StarIcon from '@mui/icons-material/Star'

interface StarsProps {
  rating?: number
}

// if index < rating && index + 1 < rating - 100%
// if index < rating && index + 1 > rating - 50%
// else 0%

const fill = (rating: StarsProps['rating'], index: number) => {
  let fill = 0
  if (rating! > index) {
    fill = rating! >= index + 1 ? 100 : 50
    return `linear-gradient(to right, #ffcf0d ${fill}%, grey ${100 - fill}%)`
  }
  return 'grey'
}

const Stars: React.FC<StarsProps> = ({ rating = 0 }) => {
  return (
    <Box display='flex' mr={0.25} color='white'>
      {Array.from(Array(5)).map((_, index) => (
        <Box
          key={`star-${index}`}
          component='span'
          sx={theme => ({
            display: 'flex',
            height: 12,
            width: 12,
            fontSize: theme.typography.caption.fontSize,
            background: fill(rating, index),
            borderRadius: 0.25,
            mr: 0.25,
          })}
        >
          <StarIcon fontSize='inherit' />
        </Box>
      ))}
    </Box>
  )
}

export default Stars
