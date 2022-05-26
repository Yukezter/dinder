import React, { ChangeEvent } from 'react'
// import { useNavigate } from 'react-router-dom'
import algoliasearch from 'algoliasearch/lite'
import { getAlgoliaResults } from '@algolia/autocomplete-js'
import { createLocalStorageRecentSearchesPlugin } from '@algolia/autocomplete-plugin-recent-searches'
// import { search } from '@algolia/autocomplete-plugin-recent-searches/usecases/localStorage'
import { parseAlgoliaHitHighlight } from '@algolia/autocomplete-preset-algolia'
import {
  createAutocomplete,
  AutocompleteState as _AutocompleteState,
  AutocompleteApi,
} from '@algolia/autocomplete-core'

import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY } from '../config/algoliasearch'
import { UsersService } from '../services/users'
import { User } from '../context/FirestoreContext'

type HighLightedParts = {
  isHighlighted: boolean
  value: string
}[]

export type SearchItem = {
  objectID: string
  photoURL: string
  name: string
  username: string
  about: string
  _highlightedParts: {
    name: HighLightedParts
    username: HighLightedParts
  }
}

type RecentSearchesItem = SearchItem & {
  id: string
  label: string
}

export type AutocompleteState = _AutocompleteState<SearchItem> | null
export type Autocomplete = AutocompleteApi<
  SearchItem,
  React.ChangeEvent<Element>,
  React.MouseEvent<Element, MouseEvent>,
  React.KeyboardEvent<Element>
> & {
  getRemoveRecentItemProps: (item: SearchItem) => {
    onClick: React.MouseEventHandler<HTMLButtonElement>
  }
}

const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY)
const indexName = process.env.NODE_ENV === 'development' ? 'dev_users' : 'users'

const useSearch = (viewProfile: (userProfile?: User | undefined) => void) => {
  // const navigate = useNavigate()

  const [autocompleteState, setAutocompleteState] =
    React.useState<AutocompleteState>(null)

  const recentSearchesPlugin = React.useMemo(
    () =>
      createLocalStorageRecentSearchesPlugin<RecentSearchesItem>({
        key: 'search',
        limit: 3,
        transformSource({ source }) {
          return {
            ...source,
            sourceId: 'recent',
            getItemInputValue({ state }) {
              return state.query
            },
            onSelect({ item }) {
              viewProfile({
                uid: item.objectID,
                photoURL: item.photoURL,
                name: item.name,
                username: item.username,
                about: item.about,
              })
            },
          }
        },
      }),
    []
  )

  const autocomplete = React.useMemo(
    () =>
      createAutocomplete<
        SearchItem,
        ChangeEvent,
        React.MouseEvent,
        React.KeyboardEvent
      >({
        plugins: [recentSearchesPlugin],
        placeholder: 'Find contacts!',
        stallThreshold: 1000,
        debug: true,
        onStateChange(stateChangeProps) {
          const { state } = stateChangeProps
          setAutocompleteState({
            ...state,
            isOpen: !!state.query,
          })
        },
        getSources() {
          return [
            {
              sourceId: 'users',
              getItemInputValue({ state }) {
                return state.query
              },
              getItems: ({ query }) => {
                return getAlgoliaResults({
                  searchClient,
                  queries: [
                    {
                      indexName,
                      query,
                      params: {
                        hitsPerPage: 6,
                        disableTypoToleranceOnAttributes: ['name', 'username'],
                      },
                    },
                  ],
                  transformResponse({ hits: allHits }) {
                    allHits.forEach(hits => {
                      hits.forEach(hit => {
                        hit._highlightedParts = {
                          name: parseAlgoliaHitHighlight({
                            hit,
                            attribute: 'name',
                          }),
                          username: parseAlgoliaHitHighlight({
                            hit,
                            attribute: 'username',
                          }),
                        }
                      })
                    })

                    return allHits
                  },
                })
              },
              onSelect({ item }) {
                viewProfile({
                  uid: item.objectID,
                  photoURL: item.photoURL,
                  name: item.name,
                  username: item.username,
                  about: item.about,
                })

                item._highlightedParts = {
                  name: [{ value: item.name, isHighlighted: false }],
                  username: [{ value: item.username, isHighlighted: false }],
                }

                recentSearchesPlugin.data!.addItem({
                  id: item.objectID,
                  label: item.name,
                  ...item,
                })
              },
            },
          ]
        },
      }),
    [recentSearchesPlugin]
  )

  React.useEffect(() => {
    const unsubscribe = UsersService.onUsernamesSnapshot(
      () => {
        searchClient.clearCache().then(() => {
          autocomplete.refresh()
        })
      },
      err => {
        console.log(err)
      }
    )

    return unsubscribe
  }, [autocomplete])

  const removeRecentItem = React.useCallback(
    (item: SearchItem): React.MouseEventHandler<HTMLButtonElement> =>
      e => {
        e.stopPropagation()

        if (autocompleteState) {
          recentSearchesPlugin.data!.removeItem(item.objectID)

          autocomplete.setCollections(
            autocompleteState.collections.map(collection => {
              if (collection.source.sourceId === 'recent') {
                collection.items = collection.items.filter(
                  ({ objectID }) => objectID !== item.objectID
                )
              }

              return collection
            })
          )
        }
      },
    [autocomplete, autocompleteState, recentSearchesPlugin.data]
  )

  return {
    autocomplete: {
      ...autocomplete,
      getRemoveRecentItemProps: (item: SearchItem) => ({
        onClick: removeRecentItem(item),
      }),
    },
    autocompleteState,
  }
}

export default useSearch
