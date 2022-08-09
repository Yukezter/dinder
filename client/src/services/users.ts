import {
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
  FirestoreError,
  QuerySnapshot,
  documentId,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, deleteObject } from 'firebase/storage'

import { OnlineStatus, Username, User, Business } from '../types'
import { cloud } from '../utils/api'
import { storage } from '../firebase'
import { BaseService } from '../utils/db'

export class UsersService extends BaseService {
  static collection = {
    usernames: () => this.getCol<Username>('usernames'),
    status: () => this.getCol<OnlineStatus>('status'),
    users: () => this.getCol<User>('users'),
    businesses: (userId: string) => this.getCol<Business>('users', userId, 'businesses'),
  }

  static doc = {
    usernames: (username: string) => this.getDoc<Username>('usernames', username),
    user: (id: string) => this.getDoc<User>('users', id),
    contacts: (id: string) => this.getDoc<{ [id: string]: boolean }>('contacts', id),
    businesses: (id1: string, id2: string) =>
      this.getDoc<Business>('users', id1, 'businesses', id2),
  }

  static async usernameExists(username: string) {
    const usernamesRef = this.doc.usernames(username)
    const usernameDoc = await getDoc(usernamesRef)
    return usernameDoc.exists()
  }

  static updateUser = async (
    data: Pick<User, 'name' | 'username'> & {
      about?: string
    }
  ) => {
    const res = await cloud.post<void>('/updateUser', { data })
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

  static async getUser(userId: string) {
    const userRef = this.doc.user(userId)
    const snapshot = await getDoc(userRef)
    return snapshot.data()
  }

  static getUsers = async (userIds: string[]) => {
    if (userIds.length === 0) {
      return []
    }

    const q = this.collection.users().where(documentId(), 'in', userIds).query()
    const usersSnapshot = await getDocs(q)
    return usersSnapshot.docs.map(doc => doc.data()).filter(Boolean)
  }

  static getContacts = async () => {
    const user = this.getCurrentUser()
    const contactsRef = this.doc.contacts(user.uid)
    const contacts = await getDoc(contactsRef)
    return contacts.data() || {}
  }

  static addContact = async (id: string) => {
    const data = { data: { id } }
    const res = await cloud.post<string>('/addContact', data)
    return res.data
  }

  static deleteContact = async (id: string) => {
    const data = { data: { id } }
    const res = await cloud.post<string>('/deleteContact', data)
    return res.data
  }

  static blockUser = async (id: string) => {
    const data = { data: { id } }
    const res = await cloud.post<string>('/blockUser', data)
    return res.data
  }

  static getBusinesses = async () => {
    const user = this.getCurrentUser()
    const businessesQuery = this.collection.businesses(user.uid).orderBy('createdAt').query()
    const snapshot = await getDocs(businessesQuery)
    return snapshot.docs.map(doc => doc.data()).filter(Boolean)
  }

  static addBusiness = async (data: Omit<Business, 'createdAt'> & { createdAt?: Timestamp }) => {
    const user = this.getCurrentUser()
    const businessesRef = this.doc.businesses(user.uid, data.details.id)
    console.log(data)
    return setDoc(businessesRef, {
      ...data,
      createdAt: serverTimestamp(),
    })
  }

  static deleteBusiness = async (yelpId: string) => {
    const user = this.getCurrentUser()
    const businessesRef = this.doc.businesses(user.uid, yelpId)
    return deleteDoc(businessesRef)
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
    const q = this.collection.status().where(documentId(), 'in', contactIds).query()
    return onSnapshot(q, onNext, onError)
  }
}
