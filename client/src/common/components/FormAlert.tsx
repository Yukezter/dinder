/* eslint-disable import/no-anonymous-default-export */
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

type Props = {
  message: string
  onClose?: React.MouseEventHandler<HTMLButtonElement>
}

export default ({ message, onClose }: Props) => {
  return (
    <Alert
      severity='error'
      icon={false}
      action={
        <IconButton
          aria-label='close'
          color='inherit'
          size='small'
          onClick={onClose}
        >
          <CloseIcon fontSize='inherit' />
        </IconButton>
      }
      sx={{
        mb: 2,
        '& .MuiAlert-action': {
          alignItems: 'center',
        },
      }}
    >
      {message}
    </Alert>
  )
}
