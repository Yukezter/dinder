import React from 'react'
import {
  onSnapshot,
  DocumentSnapshot,
  FirestoreError,
  DocumentReference,
} from 'firebase/firestore'

interface UseOnDocumentSnapshotOptions<TData> {
  ref?: DocumentReference<TData>
  next?:
    | ((
        snapshot: DocumentSnapshot<TData>,
        state: UseOnDocumentSnapshotState<TData>
      ) => void)
    | undefined
  error?: ((error: FirestoreError) => void) | undefined
}

type UseOnDocumentSnapshotState<TData> = {
  loading: boolean
  data?: TData
  snapshot?: DocumentSnapshot<TData>
  error?: FirestoreError
}

export type UseOnDocumentSnapshotResult<TData> = [
  UseOnDocumentSnapshotState<TData>,
  React.Dispatch<React.SetStateAction<UseOnDocumentSnapshotState<TData>>>
]

const useOnDocumentSnapshot = <TData extends unknown>(
  options: UseOnDocumentSnapshotOptions<TData>,
  deps: React.DependencyList | undefined = []
): UseOnDocumentSnapshotResult<TData> => {
  const [state, setState] = React.useState<UseOnDocumentSnapshotState<TData>>({
    loading: false,
    snapshot: undefined,
    data: undefined,
    error: undefined,
  })

  React.useEffect(() => {
    if (!options.ref) {
      return
    }

    setState(prevState => ({ ...prevState, loading: true }))

    let active = true

    const unsubscribe = onSnapshot(options.ref, {
      next(snapshot) {
        const asyncFunc = async () => {
          const data = snapshot.data()

          if (active) {
            setState(prevState => {
              const newState = {
                ...prevState,
                loading: prevState.loading && false,
                snapshot,
                data,
              }

              if (options.next) {
                options.next(snapshot, newState)
              }

              return newState
            })
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

  return [state, setState]
}

export default useOnDocumentSnapshot
