import React from 'react'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import ListItemText from '@mui/material/ListItemText'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Checkbox from '@mui/material/Checkbox'

import { User } from '../../context/FirestoreContext'
import { useGetContacts } from '../../hooks'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

type OnChange = (newSelected: User[]) => void

type ContactSelectProps = {
  selected?: User[]
  onChange?: OnChange
}

const ContactSelect: React.FC<ContactSelectProps> = React.memo(
  props => {
    const { selected = [], onChange } = props
    const contacts = useGetContacts({
      placeholderData: [],
    })

    const ids = React.useMemo(() => {
      return selected.map(({ uid }) => uid)
    }, [selected])

    const handleChange = (event: SelectChangeEvent<string[]>) => {
      const {
        target: { value },
      } = event
      const selectedIds = typeof value === 'string' ? value.split(',') : value
      const newSelected = contacts.data!.filter(contact => {
        return selectedIds.includes(contact.uid)
      })

      if (onChange) {
        onChange(newSelected)
      }
    }

    console.log('ContactSelect')

    return (
      <div>
        <FormControl fullWidth size='small'>
          <InputLabel id='demo-multiple-checkbox-label' margin='dense' shrink>
            Contacts
          </InputLabel>
          <Select
            key='key'
            labelId='demo-multiple-checkbox-label'
            id='demo-multiple-checkbox'
            multiple
            displayEmpty
            size='small'
            value={ids}
            disabled={contacts.isLoading}
            onChange={handleChange}
            label='Contacts'
            input={<OutlinedInput size='small' label='Contacts' notched />}
            renderValue={selectedIds => {
              console.log(selectedIds)
              if (selectedIds.length === 0) {
                return (
                  <span style={{ color: 'rgba(0,0,0,0.37)' }}>
                    Who are you eating with?
                  </span>
                )
              }

              const names = contacts
                .data!.filter(contact => {
                  return selectedIds.includes(contact.uid)
                })
                .map(({ name }) => name)
                .join(', ')

              return names
            }}
            MenuProps={MenuProps}
          >
            {contacts.data!.map(({ uid, name, username }, index) => (
              <MenuItem key={`name-${index}`} value={uid}>
                <Checkbox checked={ids.indexOf(uid) > -1} />
                <ListItemText primary={name} secondary={username} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return prevProps.selected?.join() === nextProps.selected?.join()
  }
)

export default ContactSelect
