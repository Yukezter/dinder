import React from 'react'
// import { useIsMutating } from 'react-query'
import debounce from 'lodash.debounce'

import { Business, BusinessData } from '../../types'
import { useGetBusinesses } from '../../hooks/useGetBusinesses'
import { useAddBusiness } from '../../hooks/useAddBusiness'
import { useDeleteBusiness } from '../../hooks/useDeleteBusiness'

export const useToggleBusiness = (currentBusiness?: BusinessData) => {
  const businessesQuery = useGetBusinesses()
  const mutationKey = ['businesses', currentBusiness?.id]
  const addBusiness = useAddBusiness({ mutationKey })
  const deleteBusiness = useDeleteBusiness({ mutationKey })

  const getBusinessType = React.useCallback(
    (businesses?: Business[]) => {
      if (!businesses) {
        return null
      }

      const business = businesses.find(business => {
        return business.details.id === currentBusiness?.id
      })

      return business ? business.type : null
    },
    [currentBusiness?.id]
  )

  const typeFromCache = React.useMemo(() => {
    return getBusinessType(businessesQuery.data)
  }, [currentBusiness?.id, businessesQuery.data])

  const typeFromCacheRef = React.useRef(typeFromCache)
  typeFromCacheRef.current = typeFromCache

  const [optimisticType, setOptimisticType] = React.useState(typeFromCache)
  const isDebouncingRef = React.useRef(false)

  React.useEffect(() => {
    // console.log(isDebouncingRef.current, typeFromCache, currentBusiness?.id)
    if (!isDebouncingRef.current) {
      setOptimisticType(typeFromCache)
    }
  }, [currentBusiness?.id])

  const optimisticTypeRef = React.useRef(optimisticType)
  optimisticTypeRef.current = optimisticType

  const debouncedMutate = React.useCallback(
    debounce((business: BusinessData) => {
      isDebouncingRef.current = false

      if (optimisticTypeRef.current === typeFromCacheRef.current) {
        return
      }

      if (optimisticTypeRef.current !== null) {
        console.log('adding business...')
        addBusiness.mutate({
          type: optimisticTypeRef.current,
          details: business,
        })
      } else {
        console.log('deleting business...')
        deleteBusiness.mutate(business.id)
      }
    }, 3000),
    []
  )

  React.useEffect(() => {
    return () => {
      // console.log('flushed!')
      debouncedMutate.flush()
    }
  }, [currentBusiness?.id])

  const optimisticMutate = React.useCallback(
    (type: 'favorite' | 'block' | null) => {
      if (currentBusiness) {
        isDebouncingRef.current = true
        setOptimisticType(prevType => (prevType !== type ? type : null))
        debouncedMutate(currentBusiness)
      }
    },
    [currentBusiness]
  )

  const result = React.useMemo(() => {
    return {
      state: {
        isLoading: businessesQuery.isLoading,
        isFavorite: optimisticType === 'favorite',
        isBlocked: optimisticType === 'block',
        type: optimisticType,
      },
      toggleFavorite: () => optimisticMutate('favorite'),
      toggleBlock: () => optimisticMutate('block'),
    }
  }, [businessesQuery.isLoading, optimisticType, optimisticMutate])

  return result
}
