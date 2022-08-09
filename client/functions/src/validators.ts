/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-promise-reject-errors */
import * as functions from 'firebase-functions'
import { AuthData } from 'firebase-functions/lib/common/providers/tasks'
import Schema, { Rule, ValidateOption, ValidateCallback } from 'async-validator'
import { AsyncValidationError } from 'async-validator/dist-types/util'

import * as refs from './refs'

type ValidateContext = { auth?: AuthData }
type ValidateOptions = ValidateOption & ValidateContext & { [key: string]: any }

// eslint-disable-next-line require-jsdoc
class ValidationSchema extends Schema {
  // eslint-disable-next-line require-jsdoc
  async validate<T>(
    source: T,
    option: ValidateOptions = {},
    callback?: ValidateCallback
  ): Promise<T> {
    try {
      const values = await super.validate(
        source,
        { firstFields: true, ...option },
        callback
      )

      for (const key in values) {
        if (values[key] === undefined) {
          delete values[key]
        }
      }

      return values as T
    } catch (e) {
      const { errors } = e as AsyncValidationError
      throw new functions.https.HttpsError('invalid-argument', 'Validation Error', {
        type: 'validation',
        errors,
      })
    }
  }
}

/* Rules */

const location: Rule = {
  type: 'object',
  message: 'location field required',
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
    structured_formatting: {
      type: 'object',
      required: true,
      fields: {
        main_text: {
          type: 'string',
          required: true,
        },
        secondary_text: {
          type: 'string',
          required: true,
        },
      },
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
}

const yelpParams: Rule = {
  type: 'object',
  message: 'params field required',
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
      defaultField: {
        type: 'string',
      },
      message: 'categories field required',
    },
    open_now: {
      type: 'boolean',
    },
  },
}

/* Validation Schemas */

export const updateUser = new ValidationSchema({
  name: [
    {
      type: 'string',
      message: 'Name must be between 1 and 30 characters',
      min: 1,
      max: 30,
      transform(value?: string) {
        return value?.trim()
      },
    },
    {
      message: 'A name is required',
      validator(rule, value, cb, source, options) {
        const o = options as ValidateOptions
        return !!value || (!value && o.auth?.token.accessLevel === 1)
      },
    },
  ],
  username: [
    {
      type: 'string',
      message: 'Name must be between 3 and 20 characters',
      min: 3,
      max: 20,
      transform(value) {
        return value?.trim()
      },
    },
    {
      message: 'Invalid username',
      pattern: /^(?!\.\.?$)(?!.*__.*__)([^/]{3,20})$/,
    },
    {
      async asyncValidator(rule, value, cb, source, options) {
        const o = options as ValidateOptions

        // Ensure username is required if user hasn't completed sign up process
        if (!value && o.auth?.token.accessLevel !== 1) {
          return Promise.reject('A username is required')
        }

        if (value) {
          const usernameSnapshot = await refs.firestore.usernames.doc(value).get()
          const usernameData = usernameSnapshot.data()
          // If exists and is not this user's, someone else owns it
          if (usernameData && usernameData.uid !== o.auth?.uid) {
            return Promise.reject('Username unavailable')
          }
        }
      },
    },
  ],
  about: {
    type: 'string',
    message: 'About cannot be longer than 200 characters',
    max: 200,
    transform(value) {
      return value?.trim()
    },
  },
})

// updateUser.messages({
//   string: {
//     range: '',
//   },
// })

export const updateParty = new ValidationSchema({
  id: {
    type: 'string',
    message: 'A party id is required',
    required: true,
  },
  name: {
    type: 'string',
    message: 'Name must be between 1 and 30 characters',
    min: 1,
    max: 30,
    transform(value) {
      return value?.trim()
    },
  },
  members: [
    {
      type: 'array',
      defaultField: { type: 'string' },
      message: 'Party members are required',
      required: true,
      transform(value: string[]) {
        return [...new Set(value)].sort()
      },
    },
    {
      type: 'array',
      message: 'Party members must be between 2 and 20 in length',
      min: 2,
      max: 20,
    },
  ],
  location,
  params: yelpParams,
})

export const getYelpBusinesses = new ValidationSchema({
  ...location.fields,
  ...yelpParams.fields,
  offset: {
    type: 'number',
    message: 'Offset value field required',
    required: true,
  },
})
