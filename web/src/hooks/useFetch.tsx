import { ReactNode, useEffect, useState } from 'react'
import { fetchData } from '../request'
import { Spinner } from '../components/Spinner'
import { PageNotFound } from '../components/LudosRoutes'

type DataWrapperProps<T> = {
  errorEl: ReactNode
  render: (data: T) => ReactNode
}

export function useFetch<T>(url: string, isNew: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (isNew) {
        return
      }
      setData(undefined)
      try {
        setLoading(true)

        const data = await fetchData<T>(url)
        setData(data)
      } catch (e) {
        if (e instanceof Error) {
          const match = e.message.match(/status=(\d+)/)
          const status = match ? match[1] : null
          setError(status)
        } else {
          setError('500')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [url, refresh, isNew])

  function DataWrapper({ render, errorEl }: DataWrapperProps<T>) {
    if (loading) {
      return <Spinner className="mt-32 text-center" />
    }

    if (error) {
      if (error === '404') {
        return <PageNotFound />
      } else {
        return errorEl
      }
    }

    if (!data) {
      return null
    }

    return <>{render(data)}</>
  }

  return {
    data,
    loading,
    error,
    refresh: () => {
      setData(undefined)
      setRefresh(!refresh)
      setError(null)
    },
    DataWrapper
  }
}
