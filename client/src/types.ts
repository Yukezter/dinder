import { FunctionsError, FunctionsErrorCode } from 'firebase/functions'
import { Timestamp } from 'firebase/firestore'

export type ValidateError<T> = {
  message: string
  fieldValue: string
  field: keyof T
}

export type ClientError<T = { [K: string]: unknown }> = FunctionsError & {
  status: FunctionsErrorCode
  details?: {
    type: 'validation'
    errors: ValidateError<T>[]
  }
}

export type OnlineStatus = {
  [userId: string]: {
    state: 'online' | 'offline'
    lastOnline?: string
  }
}

export type Username = { userId: string }

export type User = {
  uid: string
  photoURL: string
  name: string
  username: string
  about: string
}

export type Contacts = {
  added: User[]
  blocked: User[]
}

export type Place = Pick<google.maps.places.AutocompletePrediction, 'place_id' | 'description'> & {
  structured_formatting: Omit<
    google.maps.places.AutocompletePrediction['structured_formatting'],
    'main_text_matched_substrings'
  >
}

export interface Party {
  id: string
  createdAt: Timestamp
  name: string
  admin: string
  members: string[]
  active: boolean
  lastActive: Timestamp
  location: Place & {
    latitude: number
    longitude: number
  }
  params: {
    radius: number
    price: number
    categories: string[]
    openNow?: boolean
  }
}

export interface PopulatedParty extends Omit<Party, 'members'> {
  members: User[]
}

export type UpdatePartyFields = Pick<Party, 'id' | 'name' | 'params'> & {
  members: User[]
  location: Party['location'] | null
}

export type SwipeAction = 'undo' | 'dislike' | 'super-like' | 'like'

export interface Swipes {
  [userId: string]: {
    action: SwipeAction
    timestamp: Timestamp
  }
}

export type YelpBusiness = {
  rating: number
  price: string
  phone: string
  id: string
  alias: string
  is_closed: boolean
  categories: {
    alias: string
    title: string
  }[]
  review_count: number
  name: string
  url: string
  coordinates: {
    latitude: number
    longitude: number
  }
  image_url: string
  location: {
    city: string
    country: string
    address1: string
    address2?: string
    address3?: string
    state: string
    zip_code: number
  }
  distance: number
  transactions: string[]
}

export type YelpResponse = {
  total: number
  businesses: YelpBusiness[]
  region: {
    center: {
      latitude: number
      longitude: number
    }
  }
}

export type BusinessData = Pick<
  YelpBusiness,
  | 'id'
  | 'image_url'
  | 'name'
  | 'rating'
  | 'price'
  | 'categories'
  | 'coordinates'
  | 'location'
  | 'review_count'
  | 'url'
>

export interface Business {
  type: 'favorite' | 'block'
  createdAt: Timestamp
  details: BusinessData
}

export interface Match {
  type: 'like' | 'super-like'
  createdAt: Timestamp
  lastToSwipe: string
  details: BusinessData
}

export type Businesses = {
  [yelpId: string]: Business
}
