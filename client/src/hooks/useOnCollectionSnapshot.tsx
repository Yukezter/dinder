import React from 'react'
import {
  onSnapshot,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Query,
} from 'firebase/firestore'

type Data<TData, TTransform> =
  | (TTransform extends undefined ? TData[] : TTransform)
  | undefined

type OnCollectionSnapshotOptions<TData, TTransform> = {
  ref: CollectionReference<TData> | Query<TData>
  next?: ((snapshot: QuerySnapshot<TData>) => void) | undefined
  error?: ((error: FirestoreError) => void) | undefined
  transform?:
    | ((snapshot: QuerySnapshot<TData>) => Promise<TTransform>)
    | undefined
}

type UseOnCollectionSnapshotState<TData, TTransform> = {
  loading: boolean
  data?: Data<TData, TTransform>
  error?: FirestoreError
}

export interface UseOnCollectionSnapshotResult<TData, TTransform> {
  state: UseOnCollectionSnapshotState<TData, TTransform>
  setData: (
    data: (prevData: Data<TData, TTransform>) => Data<TData, TTransform>
  ) => void
}

const useOnCollectionSnapshot = <TData extends unknown, TTransform = undefined>(
  options: OnCollectionSnapshotOptions<TData, TTransform>,
  deps: unknown[] = []
) => {
  const [state, setState] = React.useState<
    UseOnCollectionSnapshotState<TData, TTransform>
  >({
    loading: false,
    data: undefined,
    error: undefined,
  })

  React.useEffect(() => {
    setState(prevState => ({ ...prevState, loading: true }))

    let active = true

    const unsubscribe = onSnapshot(options.ref, {
      next(snapshot) {
        const asyncFunc = async () => {
          let data: TData[] | TTransform | undefined = snapshot.docs.map(doc =>
            doc.data()
          )
          if (options.transform && active) {
            data = await options.transform(snapshot)
          }

          if (active) {
            setState(prevState => ({
              ...prevState,
              loading: prevState.loading && false,
              snapshot,
              data: data as Data<TData, TTransform>,
            }))

            if (options.next) {
              options.next(snapshot)
            }
          }
        }

        asyncFunc().catch(error => {
          console.log(error)
        })
      },
      error(error) {
        setState(prevState => ({
          ...prevState,
          loading: false,
          error,
        }))

        if (options.error) {
          options.error(error)
        }
      },
    })

    return () => {
      unsubscribe()
      active = false
    }
  }, deps)

  return {
    state,
    setData: (
      data: (prevData: Data<TData, TTransform>) => Data<TData, TTransform>
    ) => {
      setState(prevState => ({ ...prevState, data: data(prevState.data) }))
    },
  }
}

export default useOnCollectionSnapshot
