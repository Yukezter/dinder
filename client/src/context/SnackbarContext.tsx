import React from 'react'
import GlobalStyles from '@mui/material/GlobalStyles'
import CloseIcon from '@mui/icons-material/Close'
import {
  SnackbarProvider as NotistackSnackbarProvider,
  closeSnackbar,
  SnackbarAction as NotistackAction,
} from 'notistack'

import { IconButton } from '../common/components'

const SnackbarAction: NotistackAction = snackbarKey => (
  <IconButton size='small' onClick={() => closeSnackbar(snackbarKey)}>
    <CloseIcon />
  </IconButton>
)

export const SnackbarProvider: React.FC = props => {
  return (
    <>
      <GlobalStyles
        styles={theme => ({
          '& .SnackbarRoot': {
            right: theme.spacing(5),
          },
        })}
      />
      <NotistackSnackbarProvider
        maxSnack={1}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        action={SnackbarAction}
        // autoHideDuration={null}
        autoHideDuration={3000}
        classes={{ containerAnchorOriginBottomRight: 'SnackbarRoot' }}
        {...props}
      />
    </>
  )
}
