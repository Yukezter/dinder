import React from 'react'
import { ControllerRenderProps } from 'react-hook-form'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'

import { UpdatePartyFields } from '../../types'

type DistanceSliderProps = Omit<ControllerRenderProps<UpdatePartyFields, 'params.radius'>, 'ref'>

const DistanceSlider = ({ value: defaultValue, onChange }: DistanceSliderProps) => {
  const [value, setValue] = React.useState<number | string | Array<number | string>>(defaultValue)

  const handleSliderCommit = React.useCallback(
    (_: Event | React.SyntheticEvent<Element, Event>, value: number | number[]) => {
      onChange(value as number)
    },
    [onChange]
  )

  return (
    <Box mb={2}>
      <Box display='flex' justifyContent='space-between' alignItems='flex-end' mb={1}>
        <Typography variant='body2'>Distance</Typography>
        <Typography component='span' variant='body2' align='right'>
          {value} miles
        </Typography>
      </Box>
      <Slider
        min={10}
        max={25}
        value={typeof value === 'number' ? value : 0}
        onChange={(_, newValue) => setValue(newValue)}
        onChangeCommitted={handleSliderCommit}
        aria-label='Distance from location in miles.'
      />
    </Box>
  )
}

export default DistanceSlider
