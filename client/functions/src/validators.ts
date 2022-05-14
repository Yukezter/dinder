/* eslint-disable prefer-promise-reject-errors */
// import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
// import { firestore } from './app'
// import * as Joi from 'joi'
import Schema, {
  // ValidateMessages,
  Rule,
  ValidateOption,
} from 'async-validator'

// const messages: ValidateMessages = {
//   required: '%s is required',
// }

type ValidateContext = {
  uid: string
}

type ValidateOptions = ValidateOption & ValidateContext

const name: Rule = {
  type: 'string',
  message: 'A name is required',
}

const username: Rule = [
  {
    type: 'string',
    min: 3,
    max: 30,
    pattern: /^(?!\.\.?$)(?!.*__.*__)([^/]{3,30})$/,
    message: 'Username must be alphanumeric and 3-30 characters',
  },
  {
    asyncValidator: async (rule, value, cb, source, o) => {
      const username = value
      const options = o as ValidateOptions
      const uid = options?.uid
      const usernameRef = admin
        .firestore()
        .collection('usernames')
        .doc(username)
      const usernameDoc = await usernameRef.get()

      if (usernameDoc.exists && usernameDoc.data()?.uid === uid) {
        return Promise.reject('Username already owned')
      }

      // If not assigned and exists, someone else owns it
      if (usernameDoc.exists && usernameDoc.data()?.uid !== uid) {
        return Promise.reject('Username unavailable')
      }

      return value
    },
  },
]

const email: Rule = {
  type: 'email',
  message: 'Email is required',
}

const timestamp: Rule = {
  type: 'object',
  required: true,
  fields: {
    seconds: {
      type: 'number',
    },
    nanoseconds: {
      type: 'number',
    },
  },
  message: 'timestamp field required',
}

const location: Rule = {
  type: 'object',
  required: true,
  fields: {
    place_id: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    latitude: {
      type: 'number',
      required: true,
    },
    longitude: {
      type: 'number',
      required: true,
    },
  },
  message: 'location field required',
}

const yelpParams: Rule = {
  type: 'object',
  required: true,
  fields: {
    radius: {
      type: 'number',
      required: true,
      message: 'radius field required',
    },
    price: {
      type: 'number',
      required: true,
      message: 'price field required',
    },
    categories: {
      type: 'array',
      // required: true,
      // enum: [''],
      defaultField: {
        type: 'string',
      },
      message: 'categories field required',
    },
    open_now: {
      type: 'boolean',
    },
  },
  message: 'params field required',
}

export default {
  signUp: new Schema({
    name: {
      ...name,
      required: true,
    },
    username: {
      ...username,
      required: true,
    },
    email: {
      ...email,
      required: true,
    },
    password: {
      type: 'string',
      required: true,
      pattern: /^[a-zA-Z0-9]{6,30}$/,
      message: 'Password must be alphanumeric and 6-30 characters',
    },
  }),
  updateUser: new Schema({
    name,
    username,
    about: {
      type: 'string',
      max: 1000,
      message: 'Your "About me" cannot be over 1000 charcters',
    },
  }),
  updateParty: new Schema({
    id: {
      type: 'string',
      required: true,
      message: 'id required',
    },
    name,
    admin: name,
    members: {
      type: 'array',
      required: true,
      min: 0,
      defaultField: {
        type: 'string',
      },
      message: 'members field required',
    },
    active: {
      type: 'boolean',
      required: true,
      message: 'active field required',
    },
    location,
    params: yelpParams,
    lastActive: timestamp,
    createdAt: timestamp,
  }),
  yelpParams: new Schema({
    ...location.fields,
    ...yelpParams.fields,
  }),
}
