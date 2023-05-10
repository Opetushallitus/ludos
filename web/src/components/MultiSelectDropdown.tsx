import { useRef } from 'react'
import { Icon } from './Icon'
import { useDropdownState } from '../hooks/useDropdownState'
import { KoodiDtoIn } from '../KoodistoContext'

type MultiSelectProps = {
  options: KoodiDtoIn[]
  selectedOptions: KoodiDtoIn[]
  onSelectedOptionsChange: (options: KoodiDtoIn[]) => void
  onClose?: (options: KoodiDtoIn[]) => void
  onOpen?: (bool: boolean) => void
  canReset?: boolean
}

export const MultiSelectDropdown = ({
  options,
  selectedOptions,
  onSelectedOptionsChange,
  onClose,
  onOpen,
  canReset
}: MultiSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption } = useDropdownState({
    options,
    selectedOptions,
    onSelectedOptionsChange,
    containerRef
  })

  return (
    <div
      className="relative mx-2 mb-3 mt-1 border border-gray-secondary"
      ref={containerRef}
      onBlur={(e) => {
        e.preventDefault()
        onClose && onClose(selectedOptions)
        setIsOpen(false)
      }}
      tabIndex={0}>
      <div
        className="flex bg-white px-2"
        onClick={() => {
          !isOpen && onOpen && onOpen(true)
          // don't trigger on close if not expanded
          isOpen && onClose && onClose(selectedOptions)
          setIsOpen(!isOpen)
        }}>
        <div className="row w-full flex-wrap gap-2 py-1">
          {selectedOptions.length ? (
            <>
              {selectedOptions.map((opt, i) => (
                <div className="flex w-auto flex-col rounded-2xl bg-green-primary">
                  <div className="my-auto flex items-center">
                    <p
                      className="px-2 py-1 text-center text-xs text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOption(opt)
                      }}
                      key={i}>
                      {opt.nimi}
                    </p>
                    <Icon
                      name="sulje"
                      color="text-white"
                      size="sm"
                      customClass="hover:cursor-pointer hover:bg-white hover:text-black px-1"
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <span className="text-gray-secondary">Valitse...</span>
          )}
        </div>
        <div className="mt-1">
          {selectedOptions.length && canReset ? (
            <Icon
              name="sulje"
              color="text-black"
              onClick={(e) => {
                e.stopPropagation()
                onSelectedOptionsChange([])
              }}
            />
          ) : (
            <Icon name="laajenna" color="text-black" />
          )}
        </div>
      </div>
      <ul
        className={`${
          isOpen ? '' : 'hidden'
        } absolute -left-1 z-50 mt-2 max-h-96 w-full overflow-y-scroll border border-gray-secondary bg-white px-2 py-1`}>
        {options.map((option, i) => (
          <li
            className={`cursor-pointer px-2 hover:text-white ${
              selectedOptions.includes(option) ? 'bg-green-light text-white' : ''
            } ${i === highlightedIndex ? 'bg-green-primary text-white' : ''}`}
            onClick={() => toggleOption(option)}
            onMouseEnter={() => setHighlightedIndex(i)}
            key={i}>
            {option.nimi}
          </li>
        ))}
      </ul>
    </div>
  )
}
