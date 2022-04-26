import React from 'react'
import { useQueryClient, useIsFetching } from 'react-query'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import ListItemText from '@mui/material/ListItemText'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Checkbox from '@mui/material/Checkbox'

import { User } from '../../context/FirestoreContext'

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

const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
]

type OnChange = (selectedContacts: User[]) => void

type ContactSelectProps = {
  selected?: string[]
  onChange?: OnChange
}

const ContactSelect: React.FC<ContactSelectProps> = props => {
  const { selected, onChange } = props
  const queryClient = useQueryClient()
  const isFetching = useIsFetching('contacts')
  const [contactIds, setContactIds] = React.useState<string[]>(() => {
    return selected || []
  })

  const contacts = React.useMemo(() => {
    return queryClient.getQueryData<User[]>('contacts')!
  }, [isFetching])

  const selectedContacts = React.useMemo(() => {
    return contactIds.reduce<User[]>((acc, curr, _) => {
      const contact = contacts.find(({ uid }) => uid === curr)
      if (contact) acc.push(contact)
      return acc
    }, [])
  }, [contacts, contactIds])

  React.useEffect(() => {
    if (onChange) {
      onChange(selectedContacts)
    }
  }, [selectedContacts])

  const handleChange = (event: SelectChangeEvent<typeof contactIds>) => {
    const {
      target: { value },
    } = event
    console.log(value)
    setContactIds(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    )
  }

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
          value={contactIds}
          onChange={handleChange}
          label='Contacts'
          input={<OutlinedInput size='small' label='Contacts' notched />}
          renderValue={selected => {
            if (selected.length === 0) {
              return (
                <span style={{ color: 'rgba(0,0,0,0.37)' }}>
                  Who are you eating with?
                </span>
              )
            }

            return selectedContacts.map(contact => contact.name).join(', ')
          }}
          MenuProps={MenuProps}
        >
          {contacts.map(({ uid, name, username }, index) => (
            <MenuItem key={`name-${index}`} value={uid}>
              <Checkbox checked={contactIds.indexOf(uid) > -1} />
              <ListItemText primary={name} secondary={username} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}

export default ContactSelect
