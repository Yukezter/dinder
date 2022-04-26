import {
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
} from 'firebase-admin/firestore'

export const isValidDocId = (id: string): boolean => {
  return !!id && /^(?!\.\.?$)(?!.*__.*__)([^/]{1,1500})$/.test(id)
}

export const converter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    return snapshot.data() as T
  },
})
