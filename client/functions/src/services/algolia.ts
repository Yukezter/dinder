import * as functions from 'firebase-functions'
import algoliasearch from 'algoliasearch'

export const client = algoliasearch(
  functions.config().algolia.id,
  functions.config().algolia.key
)

const index = {
  users: client.initIndex(process.env.FUNCTIONS_EMULATOR ? 'dev_users' : 'users'),
}

export default index
