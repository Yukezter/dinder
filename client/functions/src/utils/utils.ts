import * as _ from 'lodash'

export const isEqual = <T, S>(a: T, b: S, keys: (keyof (T | S))[] = []): boolean =>
  _.isEqual(_.pick(a, keys), _.pick(b, keys))
