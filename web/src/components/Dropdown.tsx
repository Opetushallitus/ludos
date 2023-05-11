import { useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { useDropdownCloseOnBlur } from '../hooks/useDropdownCloseOnBlur'

type DropdownProps<C extends boolean | undefined> = {
  currentOption: string | null
  options: { key: string; value: string }[]
  onOptionClick: (option: C extends true ? string | null : string) => void
  canReset?: C
  testId?: string
}

type WithReset = DropdownProps<true>
type WithoutReset = DropdownProps<false>
type WithOptionalReset = DropdownProps<undefined>

export const Dropdown = ({
  currentOption,
  options,
  onOptionClick,
  canReset,
  testId
}: WithReset | WithoutReset | WithOptionalReset) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useDropdownCloseOnBlur(false, setIsOpen)

  return (
    <div className="relative mx-2 mb-3 mt-1 border border-gray-secondary" ref={dropdownRef}>
      <Button
        className="flex w-full items-center justify-between bg-white px-2 py-1"
        onClick={() => setIsOpen(!isOpen)}
        data-testid={testId}
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
      <ul className={`${isOpen ? '' : 'hidden'} dropdownContent`}>
        {options.map((option, i) => (
          <li
            className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
              option.value === currentOption ? 'text-green-primary' : ''
            }`}
            onClick={() => {
              onOptionClick(option.key)
              setIsOpen(false)
            }}
            key={i}
            data-testid={`${testId}-option-${option.key}`}>
            {option.value}
          </li>
        ))}
      </ul>
    </div>
  )
}
