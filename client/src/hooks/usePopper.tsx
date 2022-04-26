import React from 'react'
import { PopperProps } from '@mui/material/Popper'

const usePopper = <T extends HTMLElement>() => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

  const handlePopperOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopperClose = (event?: any) => {
    if (anchorEl && anchorEl.contains(event?.target as HTMLElement)) {
      return
    }

    setAnchorEl(null)
  }

  const handlePopperToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(prevEl => (!prevEl ? event.currentTarget : null))
  }

  const open = Boolean(anchorEl)

  const getPopperProps = (): PopperProps => ({
    open,
    anchorEl,
    placement: 'bottom-end',
    role: undefined,
    keepMounted: true,
    style: { zIndex: 1500 },
  })

  return {
    anchorEl,
    handlePopperOpen,
    handlePopperClose,
    handlePopperToggle,
    open,
    getPopperProps,
  }
}

export default usePopper

// const usePopper = <T extends HTMLElement>() => {
//   const anchorEl = React.useRef<T>(null)
//   const [open, setOpen] = React.useState(false)

//   const toggle = (event: React.MouseEvent<T>) => {
//     setOpen(prev => !prev)
//   }

//   const close = (event?: MouseEvent | TouchEvent) => {
//     if (
//       anchorEl.current &&
//       anchorEl.current.contains(event?.target as HTMLElement)
//     ) {
//       return
//     }

//     setOpen(false)
//   }

//   const getPopperProps = (): PopperProps => ({
//     open,
//     anchorEl: anchorEl.current,
//     placement: 'bottom-end',
//     role: undefined,
//     keepMounted: true,
//     disablePortal: true,
//     style: { zIndex: 1500 },
//   })

//   return { anchorEl, open, toggle, close, getPopperProps }
// }
