import { useEffect, useRef } from 'react'

export function useInputAutoFocus(open: boolean, autoSelect: boolean = false) {
  const focusRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      focusRef.current?.focus()
      if (autoSelect) {
        focusRef.current?.select()
      }
    }
  }, [open, autoSelect])

  return focusRef
}
