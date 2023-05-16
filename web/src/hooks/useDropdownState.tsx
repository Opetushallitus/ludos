import { RefObject, useCallback, useEffect, useState } from 'react'
import { KoodiDtoIn } from '../KoodistoContext'

type UseDropdownStateProps = {
  options: KoodiDtoIn[]
  selectedOptions?: KoodiDtoIn | KoodiDtoIn[]
  onSelectedOptionsChange: (selectedOptions: KoodiDtoIn | KoodiDtoIn[]) => void
  containerRef: RefObject<HTMLDivElement>
}

export const useDropdownState = ({
  options,
  selectedOptions,
  onSelectedOptionsChange,
  containerRef
}: UseDropdownStateProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const toggleOption = useCallback(
    (option: KoodiDtoIn) => {
      const isArr = selectedOptions instanceof Array

      if (!isArr) {
        return onSelectedOptionsChange(option)
      }

      if (selectedOptions.includes(option)) {
        return onSelectedOptionsChange(selectedOptions.filter((selected) => selected !== option))
      }

      return onSelectedOptionsChange([...selectedOptions, option])
    },
    [onSelectedOptionsChange, selectedOptions]
  )

  useEffect(() => {
    const container = containerRef.current
    const handler = (e: KeyboardEvent) => {
      if (e.target !== container) {
        return
      }

      switch (e.code) {
        case 'Enter':
        case 'Space':
          e.preventDefault()
          if (isOpen) {
            toggleOption(options[highlightedIndex])
          }
          break
        case 'ArrowUp':
        case 'ArrowDown': {
          if (!isOpen) {
            setIsOpen(true)
            break
          }

          const newValue = highlightedIndex + (e.code === 'ArrowDown' ? 1 : -1)

          if (newValue >= 0 && newValue < options.length) {
            setHighlightedIndex(newValue)
          }

          break
        }
        case 'Escape':
          setIsOpen(false)
          break
      }
    }

    container?.addEventListener('keydown', handler)

    return () => {
      container?.removeEventListener('keydown', handler)
    }
  }, [isOpen, highlightedIndex, options, containerRef, toggleOption])

  return { isOpen: isOpen, setIsOpen: setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption }
}
