import { useState } from 'react'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { useDropdownCloseOnBlur } from '../../hooks/useDropdownCloseOnBlur'
import { LocaleDropdownOptions } from '../../hooks/useLudosTranslation'

interface LocaleDropdownProps {
  currentOption: string
  options: LocaleDropdownOptions
  onOptionClick: (lang: string) => void
  testId: string
}

export const HeaderDropdown = ({ currentOption, options, onOptionClick, testId }: LocaleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useDropdownCloseOnBlur<boolean>(false, setIsOpen)

  return (
    <div ref={dropdownRef} data-testid={testId}>
      <Button
        className="flex items-center text-green-primary"
        data-testid={`${testId}-expand`}
        onClick={() => setIsOpen(!isOpen)}
        variant="buttonGhost">
        {currentOption}
        <Icon name="laajenna" color="text-black" />
      </Button>
      {isOpen && (
        <ul className="absolute -left-1 mt-2 w-36 border border-gray-secondary bg-white px-2 py-1">
          {Object.keys(options).map((option, i) => (
            <li
              className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
                options[option].name === currentOption ? 'text-green-primary' : ''
              }`}
              data-testid={options[option].testId ?? undefined}
              key={i}
              onClick={() => {
                onOptionClick(option)
                setIsOpen(false)
              }}>
              {options[option].name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
