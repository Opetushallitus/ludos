import { useState } from 'react'
import { Icon } from './Icon'
import { useDropdownCloseOnBlur } from '../hooks/useDropdownCloseOnBlur'

type MultiSelectProps = {
  options: { key: string; value: string }[]
  selectedOptions: string[]
  onSelectedOptionsChange: (options: string[]) => void
  canReset?: boolean
}

export const MultiSelectDropdown = ({
  options,
  selectedOptions,
  onSelectedOptionsChange,
  canReset
}: MultiSelectProps) => {
  const [isExpanded, setExpansion] = useState(false)
  const dropdownRef = useDropdownCloseOnBlur(false, setExpansion)

  const toggleOption = (option: string) => {
    if (selectedOptions.includes(option)) {
      onSelectedOptionsChange(selectedOptions.filter((selected) => selected !== option))
    } else {
      onSelectedOptionsChange([...selectedOptions, option])
    }
  }

  return (
    <div className="relative mx-2 mb-3 mt-1 border border-gray-secondary" ref={dropdownRef}>
      <button
        className="flex w-full items-center justify-between bg-white px-2"
        onClick={() => setExpansion(!isExpanded)}>
        {selectedOptions.length ? (
          <span className="text-green-primary">{selectedOptions.join(', ')}</span>
        ) : (
          <span className="text-gray-secondary">Select...</span>
        )}
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
      </button>
      {isExpanded && (
        <ul className="absolute -left-1 z-50 mt-2 w-full border border-gray-secondary bg-white px-2 py-1">
          {options.map((option) => (
            <li
              key={option.key}
              className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
                selectedOptions.includes(option.key) ? 'text-green-primary' : ''
              }`}
              onClick={() => toggleOption(option.key)}>
              {option.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
