import { useEffect, useState } from 'react'

export function useMediaQuery({ query }: { query: string }): boolean {
  const [result, setResult] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    const handleMediaQueryChange = (event: { matches: boolean | ((prevState: boolean) => boolean) }) => {
      setResult(event.matches)
    }

    setResult(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMediaQueryChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange)
    }
  }, [query])

  return result
}
