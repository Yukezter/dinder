import React from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import FormControl from '@mui/material/FormControl'
import Typography from '@mui/material/Typography'
import RadioGroup from '@mui/material/RadioGroup'
import Chip from '@mui/material/Chip'
import { visuallyHidden } from '@mui/utils'

import { UpdatePartyFields } from '../../types'

type PriceRangeProps = Omit<ControllerRenderProps<UpdatePartyFields, 'params.price'>, 'ref'>

const PriceRange: React.FC<PriceRangeProps> = props => {
  const { value, onChange } = props

  const handlePriceRangeChange = (price: number) => () => {
    if (price === value && value > 1) {
      onChange(price - 1)
    } else {
      onChange(price)
    }
  }

  console.log('PriceRange')

  return (
    <FormControl sx={{ mb: 3 }}>
      <Typography id='party-settings-price-label' component='label' variant='body2' mb={2}>
        Price
      </Typography>
      <RadioGroup aria-labelledby='party-settings-price-label' name='price' row>
        {Array.from(Array(4)).map((_, index) => {
          const price = index + 1
          const isSelected = price === value
          return (
            <React.Fragment key={price}>
              <input
                id={`price-${price}`}
                name='price'
                type='radio'
                checked={isSelected}
                value={price}
                onChange={() => onChange(price)}
                onClick={handlePriceRangeChange(price)}
                style={visuallyHidden}
              />
              <Chip
                component='label'
                htmlFor={`price-${price}`}
                label={'$'.repeat(price)}
                clickable
                role={undefined}
                tabIndex={-1}
                color='primary'
                variant={value >= price ? 'filled' : 'outlined'}
                sx={{ width: 60, mr: 1 }}
              />
            </React.Fragment>
          )
        })}
      </RadioGroup>
    </FormControl>
  )
}

export default PriceRange
