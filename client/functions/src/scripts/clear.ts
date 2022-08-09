import 'dotenv/config'
import algoliasearch from 'algoliasearch'

if (!process.env.ALGOLIA_ID || !process.env.ALGOLIA_KEY) {
  throw new Error('Missing Algolia environment variables!')
}

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY)
const users = client.initIndex('dev_users')
users
  .clearObjects()
  .then(value => {
    console.log(value)
  })
  .catch(error => {
    console.log(error)
  })
