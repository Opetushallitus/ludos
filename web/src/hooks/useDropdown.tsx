import { RefObject, useCallback, useEffect, useState } from 'react'
import { KoodiDtoIn } from '../KoodistoContext'

type UseDropdownStateProps = {
  options: KoodiDtoIn[]
  selectedOptions?: KoodiDtoIn | KoodiDtoIn[]
  onSelectedOptionsChange: (selectedOptions: KoodiDtoIn | KoodiDtoIn[]) => void
  containerRef: RefObject<HTMLDivElement>
  inputRef?: RefObject<HTMLDivElement>
}

export const useDropdown = ({
  options,
  selectedOptions,
  onSelectedOptionsChange,
  containerRef,
  inputRef
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
    const handleOutsideClick = (event: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, containerRef, setIsOpen])

  useEffect(() => {
    const container = containerRef.current
    const input = inputRef?.current
    const handler = (e: KeyboardEvent) => {
      if (e.target === container || (input && e.target === input)) {
        switch (e.code) {
          case 'Enter':
          case 'Space':
            if (isOpen && e.target !== input) {
              toggleOption(options[highlightedIndex])
            }
            break
          case 'ArrowUp':
          case 'ArrowDown': {
            // stop scrolling the page with arrow keys
            e.preventDefault()

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
    }

    container?.addEventListener('keydown', handler)

    return () => {
      container?.removeEventListener('keydown', handler)
    }
  }, [isOpen, highlightedIndex, options, containerRef, toggleOption, inputRef])

  return { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption }
}
