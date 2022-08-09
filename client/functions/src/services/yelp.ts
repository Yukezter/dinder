import * as functions from 'firebase-functions'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { YelpBusiness, YelpResponse, BusinessData } from '../types'

type BusinessesResponse = Omit<YelpResponse, 'businesses'> & {
  businesses: BusinessData[]
}

const yelpClient = axios.create({
  baseURL: 'https://api.yelp.com/v3',
  headers: {
    Authorization: `Bearer ${functions.config().yelp.token}`,
  },
})

const transform = (business: YelpBusiness) => ({
  id: business.id,
  image_url: business.image_url,
  name: business.name,
  rating: business.rating,
  price: business.price,
  categories: business.categories.slice(0, 3),
  coordinates: business.coordinates,
  location: business.location,
  review_count: business.review_count,
  url: business.url,
})

const yelpService = {
  getBusiness: async (id: string) => {
    const res = await yelpClient.get<YelpBusiness>(`/businesses/${id}`)
    return {
      ...res,
      data: transform(res.data),
    }
  },
  searchBusinesses: async (
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<BusinessesResponse>> => {
    const res = await yelpClient.get<YelpResponse>('/businesses/search', config)
    return {
      ...res,
      data: {
        ...res.data,
        businesses: res.data.businesses.map(transform),
      },
    }
  },
}

export default yelpService
