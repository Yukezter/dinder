import React from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { visuallyHidden } from '@mui/utils'

import { UpdatePartyFields } from '../../types'

type Category = {
  title: string
  identifier: string
}

export const categories: Category[] = [
  { title: 'Breakfast', identifier: 'breakfast_brunch' },
  { title: 'American', identifier: 'tradamerican' },
  { title: 'Asian', identifier: 'asianfusion,chinese,vietnamese,japanese' },
  { title: 'Fast Food', identifier: 'hotdogs' },
  { title: 'Indian', identifier: 'indian' },
  { title: 'Italian', identifier: 'italian' },
  { title: 'Mexican', identifier: 'mexican' },
  { title: 'Seafood', identifier: 'seafood' },
  { title: 'Vegan', identifier: 'vegan' },
  { title: 'Vegetarian', identifier: 'vegetarian' },
  { title: 'Dessert', identifier: 'dessert' },
]

type CategoriesProps = Omit<ControllerRenderProps<UpdatePartyFields, 'params.categories'>, 'ref'>

const Categories: React.FC<CategoriesProps> = ({ value, onChange }) => {
  const [focusedValue, setFocusedValue] = React.useState<string | null>(null)

  const handleCategoryChange =
    ({ identifier }: Category) =>
    () => {
      if (!value.includes(identifier)) {
        onChange([...value.concat(identifier)])
      } else {
        onChange(value.filter(category => category !== identifier))
      }
    }

  return (
    <FormControl component='fieldset' variant='standard' sx={{ mb: 2 }}>
      <Typography component='legend' variant='body2' mb={2}>
        Categories
      </Typography>
      <Grid container spacing={1}>
        {categories.map(category => {
          const { title, identifier } = category
          const isFocused = focusedValue === identifier
          const isSelected = value.includes(identifier)

          return (
            <Grid key={title} item xs='auto'>
              <input
                id={`category-${title}`}
                name='category'
                type='checkbox'
                defaultChecked={isSelected}
                value={title}
                onFocus={() => setFocusedValue(identifier)}
                onBlur={() => setFocusedValue(null)}
                onClick={handleCategoryChange(category)}
                style={visuallyHidden}
              />
              <Chip
                className={isFocused ? 'Mui-focusVisible' : ''}
                component='label'
                htmlFor={`category-${title}`}
                label={title}
                color='primary'
                variant={isSelected ? 'filled' : 'outlined'}
                clickable
                tabIndex={-1}
                role={undefined}
                sx={{ border: isSelected ? '1px solid transparent' : '' }}
              />
            </Grid>
          )
        })}
      </Grid>
    </FormControl>
  )
}

export default Categories
