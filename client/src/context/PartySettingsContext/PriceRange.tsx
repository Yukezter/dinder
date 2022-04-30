import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

type OnChangePrice = (value: number) => void

const PriceRange = React.memo(
  ({ price = 2, onChange }: { price?: number; onChange?: OnChangePrice }) => {
    const [value, setValue] = React.useState(price)

    const handlePriceRangeChange = (priceLevel: number) => () => {
      setValue(priceLevel)
      if (onChange) {
        onChange(value)
      }
    }
    console.log('PriceRange')

    return (
      <Box>
        <Typography component='div' variant='body1' mb={1}>
          Price
        </Typography>
        <Box display='flex' mb={1}>
          {Array.from(Array(4)).map((_, index) => {
            const priceLevel = index + 1
            return (
              <Chip
                key={index}
                label={'$'.repeat(priceLevel)}
                color='primary'
                variant={value >= priceLevel ? 'filled' : 'outlined'}
                onClick={handlePriceRangeChange(priceLevel)}
                sx={{ width: 60, mr: 1 }}
              />
            )
          })}
        </Box>
      </Box>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.price === nextProps.price
  }
)

export default PriceRange
