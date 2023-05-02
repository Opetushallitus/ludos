import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

type SelectOption = {
  value: string
  label: string
}

type Props = {
  options: SelectOption[]
  selectedOptions: SelectOption[]
  onSelectedOptionsChange: (selectedOptions: SelectOption[]) => void
  containerRef: RefObject<HTMLDivElement>
}

export const useDropdownKeyboard = ({ options, selectedOptions, onSelectedOptionsChange, containerRef }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const toggleOption = useCallback(
    (option: SelectOption) => {
      if (selectedOptions.includes(option)) {
        onSelectedOptionsChange(selectedOptions.filter((selected) => selected !== option))
      } else {
        onSelectedOptionsChange([...selectedOptions, option])
      }
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

  return { isExpanded: isOpen, setExpansion: setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption }
}
