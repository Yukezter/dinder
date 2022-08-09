import * as admin from 'firebase-admin'
import {
  CollectionReference,
  DocumentReference,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
} from 'firebase-admin/firestore'

// export const isValidDocId = (id: string): boolean => {
//   return !!id && /^(?!\.\.?$)(?!.*__.*__)([^/]{1,1500})$/.test(id)
// }

export const defaultConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as T,
})

export const getColRef = <T>(
  path: string,
  converter = defaultConverter<T>()
): CollectionReference<T> => {
  return admin.firestore().collection(path).withConverter(converter)
}

export const getDocRef = <T>(
  path: string,
  converter = defaultConverter<T>()
): DocumentReference<T> => {
  return admin.firestore().doc(path).withConverter(converter)
}
