/* eslint-disable camelcase */
import { Timestamp } from 'firebase-admin/firestore'

export type CustomUserClaims = {
  accessLevel: 0 | 1
}

export interface Username {
  uid: string
}

export interface User {
  uid: string
  photoURL: string | null
  name: string | null
  username: string | null
  about: string | null
}

export type Contacts = { [userId: string]: boolean }

export interface Party {
  id: string
  name: string
  admin: string
  members: string[]
  location: {
    place_id: string
    description: string
    latitude: number
    longitude: number
  }
  params: {
    radius: number
    price: number
    categories: string[]
    open_now?: boolean
  }
  active: boolean
  lastActive: Timestamp
  createdAt: Timestamp
}

export type Members = { [userId: string]: true }

// Business (favorite or blocked)
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

export type Offsets = { [userId: string]: number }

// This keeps track of the swipe choices for a business
// If the doc contains all party member user ids, it's a match
export interface Swipes {
  [userId: string]: {
    action: 'dislike' | 'like' | 'super-like'
    timestamp: Timestamp
  }
}

export interface Match {
  type: 'like' | 'super-like'
  createdAt: Timestamp
  members: string[]
  lastToSwipe: string
  details: BusinessData
}
