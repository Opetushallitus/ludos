import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useMatomoTracking = () => {
  const location = useLocation()

  useEffect(() => {
    const window = globalThis as any
    window._paq = window._paq || []

    // Track page view
    window._paq.push(['setCustomUrl', `${window.location.origin}${location.pathname}`])
    window._paq.push(['setDocumentTitle', document.title])
    window._paq.push(['trackPageView'])
  }, [location.pathname])
}
