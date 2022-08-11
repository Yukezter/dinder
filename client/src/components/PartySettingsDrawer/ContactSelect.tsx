import React from 'react'
import debounce from 'lodash.debounce'
import { useSearchBox, useConfigure, useHits } from 'react-instantsearch-hooks-web'
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'
import Box from '@mui/material/Box'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Checkbox from '@mui/material/Checkbox'
// import Chip from '@mui/material/Chip'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import CircularProgress from '@mui/material/CircularProgress'

import { User, UpdatePartyFields } from '../../types'
import { useUser } from '../../context'
import { useGetContacts } from '../../hooks'
import { TextField, PopperMenu } from '../../common/components'

type FilterType = 'none' | 'contacts'

type MembersSelectProps = ControllerRenderProps<UpdatePartyFields, 'members'> & {
  fieldState: ControllerFieldState
}

const MembersSelect = React.forwardRef<HTMLInputElement, MembersSelectProps>((props, ref) => {
  const { fieldState, value, onChange } = props
  const user = useUser()

  const contactsQuery = useGetContacts({ select: data => data.added })
  const contacts = React.useMemo(() => {
    return contactsQuery.data ? contactsQuery.data : []
  }, [contactsQuery.data])

  useConfigure({
    hitsPerPage: 5,
    filters: `NOT objectID:${user.uid}`,
    disableTypoToleranceOnAttributes: ['name', 'username'],
  })

  const [isLoading, setIsLoading] = React.useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(
    debounce((query: string, search: (query: string) => void) => {
      search(query)
    }, 250),
    []
  )

  const queryHook = React.useCallback(
    (query: string, search: (query: string) => void) => {
      setIsLoading(Boolean(query))
      debouncedSearch(query, search)
    },
    [debouncedSearch]
  )

  const searchBoxApi = useSearchBox({ queryHook })

  const { hits: users, results } = useHits<User>()

  const noOptions = React.useMemo(() => {
    return results && results.nbHits === 0
  }, [results])

  React.useEffect(() => {
    setIsLoading(false)
  }, [results])

  const [filter, setFilter] = React.useState<FilterType>('contacts')

  const options = React.useMemo(() => {
    return filter === 'contacts' ? contacts : users
  }, [contacts, users, filter])

  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const noValue = value.length === 0

  const shouldOpen = () => {
    if (filter === 'none') {
      return (!!inputValue && !isLoading && noOptions) || !noOptions
    } else {
      return !!inputValue || options.length > 0
    }
  }

  const filterOptions = React.useMemo(() => {
    if (filter === 'none') {
      return (options: User[]) => options
    }

    return createFilterOptions<User>({
      stringify: option => `${option.name} ${option.username}`,
    })
  }, [filter])

  return (
    <Box display='flex'>
      <Autocomplete
        id='contacts-select'
        fullWidth
        multiple
        open={isOpen && shouldOpen()}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        forcePopupIcon={false}
        options={options}
        noOptionsText='No users found'
        clearOnEscape
        disablePortal
        clearOnBlur={false}
        disableCloseOnSelect
        openOnFocus={false}
        getOptionLabel={option => `@${option.username}`}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => option.uid === value.uid}
        value={value}
        onChange={(event, value) => onChange(value)}
        inputValue={inputValue}
        onInputChange={(event, newInputValue, reason) => {
          if (reason !== 'reset') {
            setInputValue(newInputValue)

            if (filter === 'none') {
              console.log('wowowowow')
              searchBoxApi.refine(newInputValue)
            }
          }
        }}
        limitTags={1}
        ChipProps={{ size: 'small' }}
        renderOption={(props, option, { selected }) => (
          <ListItem {...props} dense>
            <Checkbox size='small' checked={selected} sx={{ mr: 1 }} />
            <ListItemText
              primary={option.name}
              secondary={`@${option.username}`}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
          </ListItem>
        )}
        renderInput={params => (
          <TextField
            {...params}
            label='Members'
            placeholder={noValue ? 'Who are you eating with?' : undefined}
            name='members'
            inputRef={ref}
            size='small'
            error={Boolean(fieldState.error)}
            InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
            InputProps={{
              ...params.InputProps,
              notched: true,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress size={26} sx={{ p: 0.5 }} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      <PopperMenu
        id='filter-menu-button'
        menuId='filter-menu'
        icon={filter === 'none' ? <FilterListOffIcon /> : <FilterListIcon />}
        ml={1}
      >
        {({ menuListProps, handleClose }) => (
          <MenuList {...menuListProps} variant='selectedMenu'>
            <MenuItem
              selected={filter === 'none'}
              onClick={() => {
                setFilter('none')
                // Run a search query with current input when filter is removed.
                searchBoxApi.refine(inputValue)
                handleClose()
              }}
            >
              <em>None</em>
            </MenuItem>
            <MenuItem
              selected={filter === 'contacts'}
              onClick={() => {
                setFilter('contacts')
                handleClose()
              }}
            >
              Contacts
            </MenuItem>
          </MenuList>
        )}
      </PopperMenu>
    </Box>
  )
})

export default MembersSelect

// renderTags={(value, getTagProps) => {
//   const numTags = value.length
//   const limitTags = 1
//   return (
//     <>
//       {value.slice(0, limitTags).map((option, index) => (
//         <Chip {...getTagProps({ index })} size='small' label={`@${option.username}`} />
//       ))}
//       {numTags > limitTags && (
//         <span className={getTagProps({ index: 0 }).className}>{`+${
//           numTags - limitTags
//         }`}</span>
//       )}
//     </>
//   )
// }}
