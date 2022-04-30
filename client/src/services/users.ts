import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  DocumentSnapshot,
  DocumentData,
  Unsubscribe,
  QueryDocumentSnapshot,
  WithFieldValue,
  deleteField,
  FirestoreError,
  QuerySnapshot,
  FieldPath,
  FieldValue,
  documentId,
  DocumentReference,
  CollectionReference,
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
  UserParties,
  YelpResponse,
  Business,
  Businesses,
  Match,
  Party,
  SwipeAction,
  Swipes,
} from '../context/FirestoreContext'

const converter = <T>() => ({
  toFirestore: (data: WithFieldValue<T>) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    return snapshot.data() as T
  },
})

const getCollectionRef = <T>(path: string, ...rest: string[]) => {
  return collection(firestore, path, ...rest).withConverter(converter<T>())
}

const getDocRef = <T>(path: string, ...rest: string[]) => {
  return doc(firestore, path, ...rest).withConverter(converter<T>())
}

const constructCollection = <T extends unknown>(
  collectionRef: CollectionReference<T>
) => ({
  ref: collectionRef,
  where: (
    fieldPath: string | FieldPath,
    opStr: WhereFilterOp,
    value: unknown
  ) => {
    return query(collectionRef, where(fieldPath, opStr, value))
  },
})

const constructDoc = <T extends unknown>(
  documentRef: DocumentReference<T>
) => ({
  ref: documentRef,
})

class UsersService {
  collections = {
    status: constructCollection(getCollectionRef<OnlineStatus>('status')),
    usernames: constructCollection(getCollectionRef<Username>('usernames')),
    users: constructCollection(getCollectionRef<User>('users')),
    businesses: (userId: string) =>
      constructCollection(
        getCollectionRef<Business>('users', userId, 'businesses')
      ),
    parties: constructCollection(getCollectionRef<Party>('parties')),
    swipes: (partyId: string) =>
      constructCollection(
        getCollectionRef<Swipes>('parties', partyId, 'swipes')
      ),
    matches: (partyId: string) =>
      constructCollection(
        getCollectionRef<Match>('parties', partyId, 'matches')
      ),
  }

  docs = {
    user: (userId: string) => constructDoc(getDocRef<User>('users', userId)),
    contacts: (userId: string) =>
      constructDoc(getDocRef<Contacts>('contacts', userId)),
    userParties: (partyId: string) =>
      constructDoc(getDocRef<UserParties>('user_parties', partyId)),
    party: (partyId: string) =>
      constructDoc(getDocRef<Party>('parties', partyId)),
    businesses: (userId: string, yelpId: string) =>
      constructDoc(getDocRef<Business>('users', userId, 'businesses', yelpId)),
    swipes: (partyId: string, yelpId: string) =>
      constructDoc(getDocRef<Swipes>('parties', partyId, 'swipes', yelpId)),
  }

  async getCurrentUser() {
    return auth.currentUser
  }

  async getUser(userId: string) {
    const userRef = this.docs.user(userId).ref
    const snapshot = await getDoc(userRef)
    return snapshot.data()
  }

  async getUsers(userIds: string[]) {
    const userRef = this.collections.users.ref
    const usersQuery = query(userRef, where(documentId(), 'in', userIds))
    const usersSnapshot = await getDocs(usersQuery)
    return usersSnapshot
  }

  async getParty(partyId: string) {
    const partyRef = this.docs.party(partyId).ref
    const usersSnapshot = await getDoc(partyRef)
    return usersSnapshot.data()
  }

  async getParties(userId: string) {
    const partiesRef = this.collections.parties.where(
      'members',
      'array-contains',
      userId
    )
    const usersSnapshot = await getDocs(partiesRef)
    return usersSnapshot.docs.map(doc => doc.data())
  }

  async getYelpBusinesses(
    options: Party['params'] &
      Party['location'] & {
        offset: number
      }
  ) {
    const data = { data: options }
    const res = await api.cloud.post<{
      result: YelpResponse
    }>('/getYelpBusinesses', data)
    return res.data.result
  }

  // async getParties(partyIds: string) {
  //   const partiesRef = this.collections.parties.where(
  //     documentId(),
  //     'in',
  //     partyIds
  //   )
  //   const usersSnapshot = await getDocs(partiesRef)
  //   return usersSnapshot.docs.map(doc => doc.data())
  // }

  async getBusinesses(userId: string) {
    const businessesRef = this.collections.businesses(userId).ref
    const businessesQuery = query(businessesRef, orderBy('createdAt'))
    const snapshot = await getDocs(businessesQuery)
    return snapshot.docs.map(doc => doc.data()).filter(b => b)
  }

  async addBusiness(userId: string, data: Omit<Business, 'createdAt'>) {
    const businessId = data.business.id
    const businessesRef = this.docs.businesses(userId, businessId).ref
    return setDoc(businessesRef, {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  async getMatches(partyId: string) {
    const matchesRef = this.collections.matches(partyId).ref
    const matchesQuery = query(matchesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(matchesQuery)
    return snapshot
  }

  async updateUser(data: any) {
    const res = await api.cloud.post<void>('/updateUser', { data })
    return res.data
  }

  async setProfilePhoto(userId: string, file: File) {
    const profilePhotoRef = ref(storage, `users/${userId}/profilePhoto`)
    return uploadBytes(profilePhotoRef, file)
  }

  async deleteProfilePhoto(userId: string) {
    const profilePhotoRef = ref(storage, `users/${userId}/profilePhoto`)
    return deleteObject(profilePhotoRef)
  }

  async addContact(contactId: string) {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/addContact', data)
    return res.data
  }

  async deleteContact(contactId: string) {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/deleteContact', data)
    return res.data
  }

  async blockContact(contactId: string) {
    const data = { data: { contactId } }
    const res = await api.cloud.post<string>('/blockContact', data)
    return res.data
  }

  async updateParty(party: Party) {
    const data = { data: party }
    const res = await api.cloud.post<void>('/updateParty', data)
    return res.data
  }

  async deleteParty(partyId: string) {
    const data = { data: { partyId } }
    const res = await api.cloud.post<void>('/deleteParty', data)
    return res.data
  }

  async swipe(
    partyId: string,
    yelpId: string,
    userId: string,
    action: SwipeAction
  ) {
    const swipesRef = this.docs.swipes(partyId, yelpId).ref

    if (action === 'undo') {
      return setDoc(swipesRef, { [userId]: deleteField() }, { merge: true })
    }

    return setDoc(
      swipesRef,
      {
        [userId]: {
          action,
          timestamp: serverTimestamp(),
        },
      },
      { merge: true }
    )
  }

  /* SNAPSHOT EVENT LISTENERS */

  onUsernamesSnapshot(
    onNext: (snapshot: QuerySnapshot<Username>) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const usernamesRef = this.collections.usernames.ref
    return onSnapshot(usernamesRef, onNext, onError)
  }

  onContactsStatusSnapshot(
    contactIds: string[],
    onNext: (snapshot: QuerySnapshot<OnlineStatus>) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = this.collections.status.where(documentId(), 'in', contactIds)
    return onSnapshot(q, onNext, onError)
  }

  onCollectionSnapshot<TData>(
    reference: CollectionReference<TData> | Query<TData>,
    next: ((snapshot: QuerySnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) {
    return onSnapshot(reference, { next, error })
  }

  onDocumentSnapshot<TData>(
    reference: DocumentReference<TData>,
    next: ((snapshot: DocumentSnapshot<TData>) => void) | undefined,
    error?: ((error: FirestoreError) => void) | undefined
  ) {
    return onSnapshot(reference, { next, error })
  }
}

export default new UsersService()
