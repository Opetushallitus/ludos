import { FC, RefObject } from 'react'
import { Button } from '../Button'
import { LanguageOption, Languages } from './Header'

export const LocaleDropdown: FC<{
  currentLanguage: string
  options: LanguageOption
  onOptionClick: (lang: string) => void
  isExpanded: boolean
  setExpansion: (isExpanded: boolean) => void
  closeOnBlurRef: RefObject<HTMLDivElement>
}> = ({ currentLanguage, options, isExpanded, onOptionClick, setExpansion, closeOnBlurRef }) => (
  <div className="relative border-l-2 border-green-primary pl-5" ref={closeOnBlurRef}>
    <Button
      className="flex items-center text-green-primary"
      onClick={() => setExpansion(!isExpanded)}
      variant="buttonGhost">
      {currentLanguage}
      <svg
        className="ml-2 h-4 w-4"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </Button>
    {isExpanded && (
      <ul className="absolute mt-2 w-32 border-2 border-gray-secondary bg-white px-2 py-1">
        {Object.keys(options).map((option, i) => (
          <li
            className={`cursor-pointer px-2 hover:bg-gray-secondary hover:text-white ${
              options[option as Languages].name === currentLanguage ? 'text-green-primary' : ''
            }`}
            key={i}
            onClick={() => {
              onOptionClick(option)
              setExpansion(false)
            }}>
            {options[option as Languages].name}
          </li>
        ))}
      </ul>
    )}
  </div>
)
