import { getDoc, setDoc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore'

import {
  Match,
  Party,
  YelpResponse,
  SwipeAction,
  Swipes,
  PopulatedParty,
  UpdatePartyFields,
  Business,
} from '../types'
import { cloud } from '../utils/api'
import { BaseService } from '../utils/db'
import { UsersService } from './users'

type JSONTimestamp = {
  _nanoseconds: number
  _seconds: number
}

type UpdatePartyResult = Omit<PopulatedParty, 'createdAt' | 'lastActive'> & {
  createdAt: JSONTimestamp
  lastActive: JSONTimestamp
}

type BusinessesResponse = Omit<YelpResponse, 'businesses'> & {
  businesses: Business['details'][]
}

export class PartiesService extends BaseService {
  static collection = {
    parties: () => this.getCol<Party>('parties'),
    matches: (id: string) => this.getCol<Match>('parties', id, 'matches'),
  }

  static doc = {
    party: (id: string) => this.getDoc<Party>('parties', id),
    swipes: (id1: string, id2: string) => this.getDoc<Swipes>('parties', id1, 'swipes', id2),
    offsets: (id: string) => this.getDoc<{ [userId: string]: number }>('offsets', id),
    members: (id: string) => this.getDoc<{ [userId: string]: true }>('members', id),
  }

  static getParty = async (partyId?: string): Promise<PopulatedParty | undefined> => {
    if (!partyId) {
      return undefined
    }

    const partyRef = this.doc.party(partyId)
    const usersSnapshot = await getDoc(partyRef)
    let data = usersSnapshot.data()

    if (data) {
      const members = await UsersService.getUsers(data.members)
      return { ...data, members }
    }

    return data
  }

  static getParties = async () => {
    const user = this.getCurrentUser()
    const partiesQuery = this.collection
      .parties()
      .where('members', 'array-contains', user.uid)
      .query()

    const usersSnapshot = await getDocs(partiesQuery)
    return usersSnapshot.docs.map(doc => doc.data()).filter(Boolean)
  }

  static updateParty = async (party: UpdatePartyFields): Promise<PopulatedParty> => {
    const res = await cloud.post<{ result: UpdatePartyResult }>('/updateParty', {
      data: {
        ...party,
        members: party.members.map(({ uid }) => uid),
      },
    })

    const { createdAt, lastActive, ...data } = res.data.result
    return {
      ...data,
      createdAt: new Timestamp(createdAt._seconds, createdAt._nanoseconds),
      lastActive: new Timestamp(lastActive._seconds, lastActive._nanoseconds),
    }
  }

  static leaveParty = async (partyId: string) => {
    const data = { data: { partyId } }
    const res = await cloud.post<void>('/leaveParty', data)
    return res.data
  }

  static getYelpOffset = async (partyId: string) => {
    const user = this.getCurrentUser()
    const offsetsRef = this.doc.offsets(partyId)
    const doc = await getDoc(offsetsRef)
    return doc.exists() ? doc.data()[user.uid] || 0 : 0
  }

  static setOffset = async (partyId: string, value: number) => {
    const user = this.getCurrentUser()
    const offsetsRef = this.doc.offsets(partyId)
    await setDoc(offsetsRef, { [user.uid]: value }, { merge: true })
  }

  static getPartyBusinesses = async (
    options: Party['params'] & { offset: number }
  ): Promise<BusinessesResponse> => {
    const { data } = await cloud.post<{
      result: YelpResponse
    }>('/getYelpBusinesses', { data: options })
    return data.result
  }

  static swipe = async (partyId: string, yelpId: string, action: SwipeAction) => {
    const user = this.getCurrentUser()
    const swipesRef = this.doc.swipes(partyId, yelpId)
    return setDoc(
      swipesRef,
      {
        [user.uid]: {
          action,
          timestamp: serverTimestamp(),
        },
      },
      { merge: true }
    )
  }
}
