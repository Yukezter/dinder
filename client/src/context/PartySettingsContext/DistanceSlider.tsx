import React from 'react'
import throttle from 'lodash.throttle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'

type OnChangeDistanceSlider = (value: number) => void

type DistanceSliderProps = {
  radius?: number
  onChange?: OnChangeDistanceSlider
}

const DistanceSlider = React.memo(
  ({ radius = 20, onChange }: DistanceSliderProps) => {
    const [value, setValue] = React.useState<
      number | string | Array<number | string>
    >(radius)
    console.log('DistanceSlider')

    const handleSliderChange = React.useCallback(
      throttle((event: Event, newValue: number | number[]) => {
        setValue(newValue)
      }, 50),
      [setValue]
    )

    const handleSliderCommit = React.useCallback(
      (
        event: Event | React.SyntheticEvent<Element, Event>,
        value: number | number[]
      ) => {
        if (onChange) {
          onChange(value as number)
        }
      },
      [onChange]
    )

    return (
      <Box>
        <Typography component='div' variant='body1'>
          Distance
        </Typography>
        <Typography component='div' variant='body2' align='right'>
          {value} miles
        </Typography>
        <Slider
          min={10}
          max={25}
          value={typeof value === 'number' ? value : 0}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderCommit}
          aria-label='Distance from location'
        />
      </Box>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.radius === nextProps.radius
  }
)

export default DistanceSlider
