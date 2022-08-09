import React from 'react'
import algoliasearch, { SearchClient } from 'algoliasearch/lite'
import { InstantSearch, InstantSearchProps } from 'react-instantsearch-hooks-web'

const { REACT_APP_ALGOLIA_APP_ID: appId = '', REACT_APP_ALGOLIA_SEARCH_KEY: apiKey = '' } =
  process.env

// if (!REACT_APP_ALGOLIA_APP_ID || !REACT_APP_ALGOLIA_SEARCH_KEY) {
//   throw new Error('An Algolia app id and api key is required.')
// }

export const originalSearchClient = algoliasearch(appId, apiKey)
export const searchClient: SearchClient = {
  ...originalSearchClient,
  search: requests => {
    if (requests.every(({ params }) => !params?.query)) {
      return Promise.resolve({
        results: requests.map(
          () =>
            ({
              hits: [],
              nbHits: 0,
              nbPages: 0,
              page: 0,
              processingTimeMS: 0,
            } as any)
        ),
      })
    }

    return originalSearchClient.search(requests)
  },
}

export const indexNames = {
  users: process.env.NODE_ENV === 'development' ? 'dev_users' : 'users',
}

export const AlgoliaSearch: React.FC<Partial<InstantSearchProps>> = props => (
  <InstantSearch searchClient={searchClient} indexName={indexNames.users} {...props} />
)
