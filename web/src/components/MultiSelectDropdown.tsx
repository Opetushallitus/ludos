import { useRef } from 'react'
import { Icon } from './Icon'
import { useDropdownKeyboard } from '../hooks/useDropdownKeyboard'

export type SelectOption = {
  label: string
  value: string
}

type MultiSelectProps = {
  options: SelectOption[]
  selectedOptions: SelectOption[]
  onSelectedOptionsChange: (options: SelectOption[]) => void
  canReset?: boolean
}

export const MultiSelectDropdown = ({
  options,
  selectedOptions,
  onSelectedOptionsChange,
  canReset
}: MultiSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const { isExpanded, setExpansion, highlightedIndex, setHighlightedIndex, toggleOption } = useDropdownKeyboard({
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
        setExpansion(false)
      }}
      tabIndex={0}>
      <div className="flex items-center justify-between bg-white px-2" onClick={() => setExpansion(!isExpanded)}>
        <div className="row w-full flex-wrap gap-2 p-2">
          {selectedOptions.length ? (
            <>
              {selectedOptions.map((opt) => (
                <span
                  className="flex w-32 items-center justify-center gap-2 rounded-2xl bg-green-primary py-1 text-xs text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleOption(opt)
                  }}>
                  {opt.label}{' '}
                  <Icon
                    name="sulje"
                    color="text-white"
                    size="sm"
                    customClass="hover:cursor-pointer hover:bg-white hover:text-black"
                  />
                </span>
              ))}
            </>
          ) : (
            <span className="text-gray-secondary">Valitse...</span>
          )}
        </div>
        <div>
          {canReset ? (
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
          isExpanded ? '' : 'hidden'
        } absolute -left-1 z-50 mt-2 w-full border border-gray-secondary bg-white px-2 py-1`}>
        {options.map((option, i) => (
          <li
            key={option.value}
            className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
              selectedOptions.includes(option) ? 'bg-green-light text-white' : ''
            } ${i === highlightedIndex ? 'bg-green-primary' : ''}`}
            onMouseEnter={() => setHighlightedIndex(i)}
            onClick={() => toggleOption(option)}>
            {option.value}
          </li>
        ))}
      </ul>
    </div>
  )
}
