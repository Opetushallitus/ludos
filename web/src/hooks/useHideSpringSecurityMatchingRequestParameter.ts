import { useEffect } from 'react'

export function useHideSpringSecurityMatchingRequestParameter() {
  useEffect(() => {
    const springSecurityMatchingRequestParameterName = 'j'
    function removeUrlParameter(parameterName: string) {
      const searchParams = new URLSearchParams(location.search)
      searchParams.delete(parameterName)

      const modifiedUrl = new URL(window.location.href)
      modifiedUrl.search = searchParams.toString()

      if (modifiedUrl.search !== location.search) {
        history.replaceState(history.state, '', modifiedUrl.toString())
      }
    }

    removeUrlParameter(springSecurityMatchingRequestParameterName)
  }, [])
}
