import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

const categoryTypes = [
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

type CategoriesProps = {
  identifiers?: string[]
  onChange?: (identifiers: string[]) => void
}

const Categories = React.memo<CategoriesProps>(
  ({ identifiers = [], onChange }) => {
    const [categories, setCategories] = React.useState<string[]>(() => {
      return identifiers
        ? identifiers.map(data => {
            const cat = categoryTypes.find(cat => cat.identifier === data)!
            return cat.title
          })
        : []
    })
    console.log('Categories')
    const handleCategoryChange = (title: string) => () => {
      let newCategories: string[]
      if (!categories.includes(title)) {
        newCategories = [...categories.concat(title)]
        setCategories(newCategories)
      } else {
        newCategories = categories.filter(category => category !== title)
        setCategories(newCategories)
      }

      if (onChange) {
        onChange(
          newCategories.map(category => {
            const cat = categoryTypes.find(type => type.title === category)!
            return cat.identifier
          })
        )
      }
    }

    return (
      <Box>
        <Typography component='div' variant='body1' mb={2}>
          Categories
        </Typography>
        <Grid container spacing={1}>
          {categoryTypes.map(({ title, identifier }) => {
            const isSelected = categories.includes(title)
            return (
              <Grid key={title} item xs='auto'>
                <Chip
                  label={title}
                  color='primary'
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={handleCategoryChange(title)}
                  sx={{
                    width: '100%',
                    ...(isSelected && {
                      border: '1px solid transparent',
                    }),
                  }}
                />
              </Grid>
            )
          })}
        </Grid>
      </Box>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.identifiers?.join() === nextProps.identifiers?.join()
  }
)

export default Categories
