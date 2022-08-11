import React from 'react'
// import { useIsMutating } from 'react-query'
import debounce from 'lodash.debounce'

import { BusinessData } from '../../types'
import { useGetBusinesses } from '../../hooks/useGetBusinesses'
import { useAddBusiness } from '../../hooks/useAddBusiness'
import { useDeleteBusiness } from '../../hooks/useDeleteBusiness'

export const useToggleBusiness = (currentBusiness?: BusinessData) => {
  const businessesQuery = useGetBusinesses()
  const mutationKey = ['businesses', currentBusiness?.id]
  const addBusiness = useAddBusiness({ mutationKey })
  const deleteBusiness = useDeleteBusiness({ mutationKey })

  const typeFromCache = React.useMemo(() => {
    const business = businessesQuery.data?.find(business => {
      return business.details.id === currentBusiness?.id
    })

    return business ? business.type : null
  }, [businessesQuery.data, currentBusiness?.id])

  const typeFromCacheRef = React.useRef(typeFromCache)
  typeFromCacheRef.current = typeFromCache

  const [optimisticType, setOptimisticType] = React.useState(typeFromCache)
  const optimisticTypeRef = React.useRef(optimisticType)
  optimisticTypeRef.current = optimisticType

  const isDebouncingRef = React.useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    console.log({ typeFromCache })

    if (!isDebouncingRef.current) {
      setOptimisticType(typeFromCache)
    }

    return () => {
      debouncedMutate.flush()
    }
  }, [debouncedMutate, typeFromCache])

  const optimisticMutate = React.useCallback(
    (type: 'favorite' | 'block' | null) => {
      if (currentBusiness) {
        isDebouncingRef.current = true
        setOptimisticType(prevType => (prevType !== type ? type : null))
        debouncedMutate(currentBusiness)
      }
    },
    [debouncedMutate, currentBusiness]
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
