import { useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { useDropdownCloseOnBlur } from '../hooks/useDropdownCloseOnBlur'

type DropdownProps = {
  currentOption: string | null
  options: { key: string; value: string }[]
  onOptionClick: (option: string | null) => void
  canReset?: boolean
}

export const Dropdown = ({ currentOption, options, onOptionClick, canReset = true }: DropdownProps) => {
  const [isExpanded, setExpansion] = useState(false)
  const dropdownRef = useDropdownCloseOnBlur(false, setExpansion)

  return (
    <div className="relative mx-2 mb-3 mt-1 border border-gray-secondary" ref={dropdownRef}>
      <Button
        className="flex w-full items-center justify-between bg-white px-2"
        onClick={() => setExpansion(!isExpanded)}
        variant="buttonGhost">
        {currentOption ? (
          <>
            {currentOption}
            {canReset ? (
              <Icon
                name="sulje"
                color="text-black"
                onClick={(e) => {
                  e.stopPropagation()
                  onOptionClick(null)
                }}
              />
            ) : (
              <Icon name="laajenna" color="text-black" />
            )}
          </>
        ) : (
          <>
            <span className="text-gray-secondary">Valitse...</span>
            <Icon name="laajenna" color="text-black" />
          </>
        )}
      </Button>
      {isExpanded && (
        <ul className="absolute -left-1 z-50 mt-2 w-full border border-gray-secondary bg-white px-2 py-1">
          {options.map((option, i) => (
            <li
              className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
                option.value === currentOption ? 'text-green-primary' : ''
              }`}
              key={i}
              onClick={() => {
                onOptionClick(option.key)
                setExpansion(false)
              }}>
              {option.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
