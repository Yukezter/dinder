// @refresh reset
import React from 'react'
import { useQuery, useInfiniteQuery, UseInfiniteQueryOptions } from 'react-query'
import { BusinessData, PopulatedParty, YelpResponse } from '../../types'
import { PartiesService } from '../../services'
import { partyKeys } from '../../utils/queryKeys'
import { useGetBusinesses } from '../../hooks'

export type IndexedBusinessData = BusinessData & {
  index: number
}

export type IndexedYelpResponse = Omit<YelpResponse, 'businesses'> & {
  offset: number
  businesses: IndexedBusinessData[]
}

export const useGetPartyBusinesses = (
  party: PopulatedParty,
  options: UseInfiniteQueryOptions<IndexedYelpResponse, number> = {}
) => {
  const businesses = useGetBusinesses()

  const [offset, setOffset] = React.useState<number | null>(null)
  useQuery<number>(partyKeys.offset(party), () => PartiesService.getYelpOffset(party.id), {
    notifyOnChangeProps: ['isSuccess'],
    onSuccess: data => {
      setOffset(data)
    },
  })

  return useInfiniteQuery<IndexedYelpResponse, number>(
    // partyKeys.businesses(party, offset as number),
    partyKeys.businesses(party),
    async ({ pageParam = offset }) => {
      console.log(pageParam, offset)

      const data = await PartiesService.getPartyBusinesses({
        ...party.location,
        ...party.params,
        offset: pageParam,
      })

      return {
        ...data,
        offset: pageParam,
        businesses: data.businesses.map((business, index) => {
          // Preload images
          const image = new Image()
          image.src = business.image_url

          return {
            // Add an offset index to each business
            index: pageParam + index,
            ...business,
          }
        }),
      }
    },
    {
      enabled: businesses.isSuccess && offset !== null,
      getNextPageParam: lastPage => {
        if (lastPage.total > lastPage.offset + 20) {
          return lastPage.offset + 20
        }
      },
      select: data => {
        return {
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            // Filter out any businesses this user has blocked
            businesses: page.businesses.filter(yelpBusiness => {
              return !businesses.data?.some(({ type, details }) => {
                return type === 'block' && details.id === yelpBusiness.id
              })
            }),
          })),
        }
      },
      ...options,
    }
  )
}
