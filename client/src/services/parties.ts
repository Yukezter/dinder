import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  QueryConstraint,
  serverTimestamp,
  DocumentSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  WithFieldValue,
  FirestoreError,
  QuerySnapshot,
  FieldPath,
  DocumentReference,
  CollectionReference,
  OrderByDirection,
  Query,
  getDocs,
  WhereFilterOp,
  increment,
} from 'firebase/firestore'

import api from '../app/api'
import { firestore } from '../app/firebase'
import {
  Match,
  Party,
  YelpResponse,
  SwipeAction,
  Swipes,
} from '../context/FirestoreContext'

const converter = <T>() => ({
  toFirestore: (data: WithFieldValue<T>) => data as DocumentData,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    return snapshot.data() as T
  },
})

const c = <T>(path: string, ...rest: string[]) => {
  const ref = collection(firestore, path, ...rest).withConverter(converter<T>())
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
  return doc(firestore, path, ...rest).withConverter(converter<T>())
}

export class PartiesService {
  static collection = {
    parties: () => c<Party>('parties'),
    matches: (id: string) => c<Match>('parties', id, 'matches'),
  }

  static doc = {
    party: (id: string) => d<Party>('parties', id),
    swipes: (id1: string, id2: string) =>
      d<Swipes>('parties', id1, 'swipes', id2),
    offsets: (id: string) => d<{ [userId: string]: number }>('offsets', id),
  }

  static getParty = async (partyId: string) => {
    const partyRef = this.doc.party(partyId)
    const usersSnapshot = await getDoc(partyRef)
    return usersSnapshot.data()
  }

  static getParties = async (userId: string) => {
    const partiesQuery = this.collection
      .parties()
      .where('members', 'array-contains', userId)
      .query()

    const usersSnapshot = await getDocs(partiesQuery)
    return usersSnapshot.docs.map(doc => doc.data())
  }

  static updateParty = async (party: Party) => {
    const data = { data: party }
    const res = await api.cloud.post<void>('/updateParty', data)
    return res.data
  }

  static leaveParty = async (partyId: string) => {
    const data = { data: { partyId } }
    const res = await api.cloud.post<void>('/leaveParty', data)
    return res.data
  }

  static getInitialOffset = async (userId: string, partyId: string) => {
    const offsetsRef = this.doc.offsets(partyId)
    const doc = await getDoc(offsetsRef)
    return doc.exists() ? doc.data()[userId] || 0 : 0
  }

  static setInitialOffset = async (
    userId: string,
    partyId: string,
    value: number
  ) => {
    const offsetsRef = this.doc.offsets(partyId)
    await setDoc(
      offsetsRef,
      {
        [userId]: value,
      },
      { merge: true }
    )
  }

  static getYelpBusinesses = async (
    options: Party['params'] &
      Party['location'] & {
        offset: number
      }
  ) => {
    const res = await api.cloud.post<{
      result: YelpResponse
    }>('/getYelpBusinesses', { data: options })
    return res.data.result
  }

  static swipe = async (
    userId: string,
    partyId: string,
    yelpId: string,
    action: SwipeAction
  ) => {
    const swipesRef = this.doc.swipes(partyId, yelpId)
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
