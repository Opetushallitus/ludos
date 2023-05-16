import { useRef } from 'react'
import { Icon } from './Icon'
import { useDropdownState } from '../hooks/useDropdownState'
import { KoodiDtoIn } from '../KoodistoContext'

type MultiSelectProps = {
  id: string
  options: KoodiDtoIn[]
  selectedOptions: KoodiDtoIn[]
  onSelectedOptionsChange: (options: KoodiDtoIn[]) => void
  testId?: string
  canReset?: boolean
}

export const MultiSelectDropdown = ({
  id,
  options,
  selectedOptions,
  onSelectedOptionsChange,
  testId,
  canReset
}: MultiSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption } = useDropdownState({
    options,
    selectedOptions,
    onSelectedOptionsChange: (opt) => {
      if (opt instanceof Array) {
        onSelectedOptionsChange(opt)
      }
    },
    containerRef
  })

  return (
    <div
      className="relative mb-3 mt-1 border border-gray-secondary"
      ref={containerRef}
      onBlur={(e) => {
        e.preventDefault()
        setIsOpen(false)
      }}
      tabIndex={0}>
      <div id={id} className="flex bg-white px-2" role="button" onClick={() => setIsOpen(!isOpen)} data-testid={testId}>
        <div className="row w-full flex-wrap gap-2 py-1">
          {selectedOptions.length ? (
            <>
              {selectedOptions.map((opt, i) => (
                <div className="flex w-auto flex-col rounded-2xl bg-green-primary" key={i}>
                  <div className="my-auto flex items-center">
                    <p className="px-2 py-1 text-center text-xs text-white">{opt.nimi}</p>
                    <Icon
                      name="sulje"
                      color="text-white"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOption(opt)
                      }}
                      customClass="hover:cursor-pointer hover:bg-white hover:text-black mr-3"
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
              customClass="border-l-2 border-gray-light"
            />
          ) : (
            <Icon name="laajenna" color="text-black" />
          )}
        </div>
      </div>
      <ul className={`${isOpen ? '' : 'hidden'} dropdownContent`}>
        {options.map((option, i) => (
          <li
            className={`cursor-pointer px-3 ${
              selectedOptions.includes(option) ? 'bg-green-primary text-white hover:text-white' : ''
            } ${
              i === highlightedIndex && selectedOptions.includes(option)
                ? '!bg-green-light'
                : i === highlightedIndex
                ? 'bg-gray-light'
                : ''
            }`}
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
