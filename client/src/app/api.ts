import axios from 'axios'
import { auth } from './firebase'

let baseURL = 'https://us-central1-dinder-33ca6.cloudfunctions.net'
if (global.location.hostname === 'localhost') {
  baseURL = 'http://localhost:5001/dinder-33ca6/us-central1'
}

const cloud = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

cloud.interceptors.request.use(async config => {
  const token = await auth.currentUser?.getIdToken()
  config.headers = {
    Authorization: `Bearer ${token}`,
  }

  return config
})

cloud.interceptors.response.use(undefined, error => {
  console.dir(error)
  if (error.response.data.error) {
    return Promise.reject(error.response.data.error)
  }

  return Promise.reject(error)
})

export default {
  cloud,
}
