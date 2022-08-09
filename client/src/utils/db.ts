import {
  collection,
  doc,
  query,
  orderBy,
  where,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  WithFieldValue,
  FieldPath,
  OrderByDirection,
  WhereFilterOp,
  onSnapshot,
  DocumentSnapshot,
  FirestoreError,
  QuerySnapshot,
  DocumentReference,
  CollectionReference,
  Query,
} from 'firebase/firestore'

import { firestore, auth } from '../firebase'

export const converter = <T>() => ({
  toFirestore: (data: WithFieldValue<T>) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    return snapshot.data() as T
  },
})

export class BaseService {
  static getCurrentUser() {
    if (!auth.currentUser) {
      throw Error('No user is signed in!')
    }

    return auth.currentUser
  }

  static getCol = <T>(path: string, ...rest: string[]) => {
    const ref = collection(firestore, path, ...rest).withConverter(converter<T>())
    return {
      ref,
      queryConstraints: [] as QueryConstraint[],
      where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
        this.queryConstraints.push(where(fieldPath, opStr, value))
        return this
      },
      orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection | undefined) {
        this.queryConstraints.push(orderBy(fieldPath, directionStr))
        return this
      },
      query() {
        const queryConstraints = [...this.queryConstraints]
        this.queryConstraints = []
        return query(ref, ...queryConstraints)
      },
    }
  }

  static getDoc = <T>(path: string, ...rest: string[]) => {
    return doc(firestore, path, ...rest).withConverter(converter<T>())
  }

  static onCollectionSnapshot<TData>(
    reference: CollectionReference<TData> | Query<TData>,
    next: ((snapshot: QuerySnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) {
    return onSnapshot(reference, { next, error })
  }

  static onDocumentSnapshot<TData>(
    reference: DocumentReference<TData>,
    next: ((snapshot: DocumentSnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) {
    return onSnapshot(reference, { next, error })
  }
}
