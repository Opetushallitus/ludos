import { RefObject } from 'react'
import { Button } from '../Button'
import { LocaleDropdownOptions } from './Header'
import { Icon } from '../Icon'

interface LocaleDropdownProps {
  currentOption: string
  options: LocaleDropdownOptions
  onOptionClick: (lang: string) => void
  isExpanded: boolean
  setExpansion: (isExpanded: boolean) => void
  closeOnBlurRef: RefObject<HTMLDivElement>
}

export const HeaderDropdown = ({
  currentOption,
  options,
  isExpanded,
  onOptionClick,
  setExpansion,
  closeOnBlurRef
}: LocaleDropdownProps) => (
  <div ref={closeOnBlurRef}>
    <Button
      className="flex items-center text-green-primary"
      onClick={() => setExpansion(!isExpanded)}
      variant="buttonGhost">
      {currentOption}
      <Icon name="laajenna" color="text-black" />
    </Button>
    {isExpanded && (
      <ul className="absolute -left-1 mt-2 w-36 border border-gray-secondary bg-white px-2 py-1">
        {Object.keys(options).map((option, i) => (
          <li
            className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
              options[option].name === currentOption ? 'text-green-primary' : ''
            }`}
            key={i}
            onClick={() => {
              onOptionClick(option)
              setExpansion(false)
            }}>
            {options[option].name}
          </li>
        ))}
      </ul>
    )}
  </div>
)
