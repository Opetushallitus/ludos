import { fetchDataOrReload } from '../request'
import { QueryClient, useQuery } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 0
    }
  }
})

export function useFetch<T>(queryKey: string[], url: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...queryKey, url],
    queryFn: () => fetchDataOrReload<T>(url),
    enabled
  })
}
