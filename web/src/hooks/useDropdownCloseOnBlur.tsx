import { useEffect, useRef } from 'react'

export function useDropdownCloseOnBlur<T>(desiredState: T, setExpansion: (state: T) => void) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('asdasd')
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpansion(desiredState)
      }
    }

    document.addEventListener('click', handleOutsideClick)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [dropdownRef, setExpansion])

  return dropdownRef
}
