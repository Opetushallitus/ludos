import { useEffect, useState } from 'react'
import { fetchData } from '../request'
import { FetchErrorMessages } from '../types'

export function useFetch<T>(url: string, isNew: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    let isSubscribed = true
    setData(undefined)
    ;(async () => {
      if (isNew) {
        return
      }
      try {
        setLoading(true)

        const data = await fetchData<T>(url)
        if (isSubscribed) {
          setData(data)
          setError(null)
        }
      } catch (e) {
        if (isSubscribed) {
          setData(undefined)
          if (e instanceof Error) {
            const match = e.message.match(/status=(\d+)/)
            const status = match ? match[1] : FetchErrorMessages.UnknownError
            if (e.message === FetchErrorMessages.SessionExpired) {
              location.reload()
            }
            setError(status)
          } else {
            setError(FetchErrorMessages.UnknownError)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      isSubscribed = false
    }
  }, [url, refresh, isNew])

  return {
    data,
    loading,
    error,
    refresh: () => {
      setData(undefined)
      setRefresh(!refresh)
      setError(null)
    }
  }
}
