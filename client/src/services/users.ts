import {
  collection as _collection,
  doc as _doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
  Unsubscribe,
  QueryDocumentSnapshot,
  WithFieldValue,
  FirestoreError,
  QuerySnapshot,
  FieldPath,
  documentId,
  DocumentReference,
  CollectionReference,
  OrderByDirection,
  Query,
  getDocs,
  WhereFilterOp,
} from 'firebase/firestore'
import { ref, uploadBytes, deleteObject } from 'firebase/storage'

import api from '../app/api'
import { firestore, storage, auth } from '../app/firebase'
import {
  OnlineStatus,
  Username,
  User,
  Contacts,
  Business,
} from '../context/FirestoreContext'

const converter = <T>() => ({
  toFirestore: (data: WithFieldValue<T>) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    return snapshot.data() as T
  },
})

const c = <T>(path: string, ...rest: string[]) => {
  const ref = _collection(firestore, path, ...rest).withConverter(
    converter<T>()
  )
  return {
    ref,
    queryConstraints: [] as QueryConstraint[],
    where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown) {
      this.queryConstraints.push(where(fieldPath, opStr, value))
      return this
    },
    orderBy(
      fieldPath: string | FieldPath,
      directionStr?: OrderByDirection | undefined
    ) {
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

const d = <T>(path: string, ...rest: string[]) => {
  return _doc(firestore, path, ...rest).withConverter(converter<T>())
}

export class UsersService {
  static collection = {
    usernames: () => c<Username>('usernames'),
    status: () => c<OnlineStatus>('status'),
    users: () => c<User>('users'),
    businesses: (userId: string) => c<Business>('users', userId, 'businesses'),
  }

  static doc = {
    usernames: (username: string) => d<Username>('usernames', username),
    user: (userId: string) => d<User>('users', userId),
    contacts: (userId: string) => d<Contacts>('contacts', userId),
    businesses: (userId: string, yelpId: string) =>
      d<Business>('users', userId, 'businesses', yelpId),
  }

  static async getCurrentUser() {
    return auth.currentUser
  }

  static async usernameExists(username: string) {
    const usernamesRef = this.doc.usernames(username)
    const usernameDoc = await getDoc(usernamesRef)
    return usernameDoc.exists()
  }

  static async getUser(userId: string) {
    const userRef = this.doc.user(userId)
    const snapshot = await getDoc(userRef)
    return snapshot.data()
  }

  static getUsers = async (userIds: string[]) => {
    const userRef = this.collection.users().ref
    const usersQuery = query(userRef, where(documentId(), 'in', userIds))
    const usersSnapshot = await getDocs(usersQuery)
    return usersSnapshot
  }

  static getBusinesses = async (userId: string) => {
    const businessesRef = this.collection.businesses(userId).ref
    const snapshot = await getDocs(businessesRef)
    return snapshot.docs.map(doc => doc.data()).filter(b => b)
  }

  static addBusiness = async (userId: string, data: Business) => {
    const businessesRef = this.doc.businesses(userId, data.id)
    return setDoc(businessesRef, data)
  }

  static deleteBusiness = async (userId: string, yelpId: string) => {
    const businessesRef = this.doc.businesses(userId, yelpId)
    return deleteDoc(businessesRef)
  }

  static updateUser = async (
    data: Pick<User, 'name' | 'username'> & {
      about?: string
    }
  ) => {
    const res = await api.cloud.post<void>('/updateUser', { data })
    return res.data
  }

  static setProfilePhoto = async (userId: string, file: File) => {
    const profilePhotoRef = ref(storage, `users/${userId}/profilePhoto`)
    return uploadBytes(profilePhotoRef, file)
  }

  static deleteProfilePhoto = async (userId: string) => {
    const profilePhotoRef = ref(storage, `users/${userId}/profilePhoto`)
    return deleteObject(profilePhotoRef)
  }

  static addContact = async (contactId: string) => {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/addContact', data)
    return res.data
  }

  static deleteContact = async (contactId: string) => {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/deleteContact', data)
    return res.data
  }

  static blockContact = async (contactId: string) => {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/blockContact', data)
    return res.data
  }

  /* SNAPSHOT EVENT LISTENERS */

  static onUsernamesSnapshot = (
    onNext: (snapshot: QuerySnapshot<Username>) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const usernamesRef = this.collection.usernames().ref
    return onSnapshot(usernamesRef, onNext, onError)
  }

  static onContactsStatusSnapshot = (
    contactIds: string[],
    onNext: (snapshot: QuerySnapshot<OnlineStatus>) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const q = this.collection
      .status()
      .where(documentId(), 'in', contactIds)
      .query()
    return onSnapshot(q, onNext, onError)
  }

  static onCollectionSnapshot = <TData>(
    reference: CollectionReference<TData> | Query<TData>,
    next: ((snapshot: QuerySnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) => {
    return onSnapshot(reference, { next, error })
  }

  static onDocumentSnapshot = <TData>(
    reference: DocumentReference<TData>,
    next: ((snapshot: DocumentSnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) => {
    return onSnapshot(reference, { next, error })
  }
}

export default new UsersService()
