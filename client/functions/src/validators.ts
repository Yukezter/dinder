/* eslint-disable prefer-promise-reject-errors */
// import * as functions from 'firebase-functions'
import { Timestamp } from 'firebase-admin/firestore'
import { firestore } from './app'
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
      const usernameRef = firestore.collection('usernames').doc(username)
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
  required: true,
  validator(_, value) {
    console.log(value)
    console.log(value instanceof Timestamp)
  },
  message: 'lastActive field required',
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
      message: 'About me must be 1000 charcters or less',
    },
  }),
  createParty: new Schema({
    name,
    admin: name,
    members: {
      type: 'array',
      required: true,
      defaultField: {
        type: 'string',
      },
      message: 'Invalid members',
    },
    active: {
      type: 'boolean',
      required: true,
      message: 'active field required',
    },
    lastActive: timestamp,
    created: timestamp,
    coordinates: {
      type: 'string',
      required: true,
      message: 'coordinates field required',
    },
    radius: {
      type: 'number',
      required: true,
      message: 'radius field required',
    },
    categories: {
      type: 'array',
      required: true,
      // enum: [''],
      defaultField: {
        type: 'string',
      },
      message: 'categories field required',
    },
  }),
}

// Reusable keys

// const name = Joi.string().required().messages({
//   'string.empty': 'A name is required',
// })

// const username = Joi.string()
//   .alphanum()
//   .min(3)
//   .max(30)
//   .pattern(/^(?!\.\.?$)(?!.*__.*__)([^/]{1,1500})$/)
//   .required()
//   .messages({
//     'string.empty': 'A username is required',
//     'string.alphanum': 'Alphanumeric characters only',
//     'string.min': 'Pick a username between 3-30 characters',
//     'string.max': 'Pick a username between 3-30 characters',
//     'string.pattern.base': 'Invalid characters',
//   })

// const email = Joi.string().email().required().messages({
//   'string.empty': 'An email is required',
//   'string.email': 'Invalid email format',
// })

// // Validators

// const signUp = Joi.object({
//   password: Joi.string().pattern(/^[a-zA-Z0-9]{6,30}$/).messages({
//     'string.pattern.base': 'Invalid characters',
//   }),
// }).keys({
//   name,
//   username,
//   email,
// })

// const updateSettings = Joi.object({
//   about: Joi.string().empty('').default(null).max(500).messages({
//     'string.max': 'Number of characters cannot exceed 500',
//   }),
//   phoneNumber: Joi.string().empty('').default(null),
// }).keys({
//   name,
//   // username,
//   email,
// })

// export default {
//   username,
//   signUp,
//   updateSettings,
// }

// import { firestore } from './app'

// const usernames = firestore.collection('usernames')

// .external(async (value, helpers) => {
// const username = value
// const uid = helpers.prefs.context?.uid
// const usernameRef = usernames.doc(username)
// const usernameDoc = await usernameRef.get()

// // If not assigned and exists, someone else owns it
// if (usernameDoc.exists && username.data().uid !== uid) {
//   throw new Joi.ValidationError(
//     'string.username',
//     [
//       {
//         message: 'Username is taken',
//         path: ['username'],
//         type: 'string.username',
//         context: {
//           key: 'username',
//           label: 'username',
//           value,
//         },
//       },
//     ],
//     value
//   )
// }

// return value
// })
