import { useRef } from 'react'
import { Icon } from './Icon'
import { useDropdown } from '../hooks/useDropdown'
import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'

type DropdownProps<C extends boolean | undefined> = {
  id: string
  options: KoodiDtoIn[]
  selectedOption?: KoodiDtoIn
  onSelectedOptionsChange: (option: C extends true ? string | null : string) => void
  canReset?: C
  testId?: string
  requiredError?: boolean
}

type WithReset = DropdownProps<true>
type WithoutReset = DropdownProps<false>
type WithOptionalReset = DropdownProps<undefined>

export const Dropdown = ({
  id,
  selectedOption,
  options,
  onSelectedOptionsChange,
  canReset,
  testId,
  requiredError
}: WithReset | WithoutReset | WithOptionalReset) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex } = useDropdown({
    options,
    selectedOptions: selectedOption,
    onSelectedOptionsChange: (opt) => {
      if (opt instanceof Array) {
        return
      }
      onSelectedOptionsChange(opt.koodiArvo)
    },
    containerRef
  })

  return (
    <div
      id={id}
      className="relative mb-3 mt-1 border border-gray-secondary"
      ref={containerRef}
      onBlur={(e) => {
        e.preventDefault()
        setIsOpen(false)
      }}
      tabIndex={0}>
      <div
        className={`flex ${requiredError ? 'border border-red-primary' : ''} bg-white px-2`}
        role="button"
        aria-expanded={isOpen}
        aria-activedescendant={highlightedIndex !== null ? `${id}-${options[highlightedIndex]?.nimi}` : undefined} // Indicate the active option
        onClick={() => setIsOpen(!isOpen)}
        data-testid={testId}>
        <div className="row w-full flex-wrap gap-2 py-1">
          {selectedOption ? (
            <div className="flex w-auto flex-col">
              <div className="my-auto flex items-center">{selectedOption.nimi}</div>
            </div>
          ) : (
            <>
              <span className="text-gray-secondary">{t('filter.valitse')}</span>
            </>
          )}
        </div>
        <div className="mt-1">
          {canReset ? (
            <Button
              variant="buttonGhost"
              customClass="p-0 hover:cursor-pointer hover:bg-gray-active"
              onClick={(e) => {
                e.stopPropagation()
                onSelectedOptionsChange(null)
              }}>
              <Icon name="sulje" color="text-black" />
            </Button>
          ) : (
            <Icon name="laajenna" color="text-black" />
          )}
        </div>
      </div>
      <ul className={`${isOpen ? '' : 'hidden'} dropdownContent`} role="listbox" aria-labelledby={`${id}-label`}>
        {options.map((option, i) => (
          <li
            className={`cursor-pointer px-3 ${
              selectedOption === option ? 'bg-green-primary text-white hover:text-white' : ''
            } ${
              i === highlightedIndex && selectedOption === option
                ? '!bg-green-light'
                : i === highlightedIndex
                ? 'bg-gray-light'
                : ''
            }`}
            onClick={() => {
              onSelectedOptionsChange(option.koodiArvo)
              setIsOpen(false)
            }}
            onMouseEnter={() => setHighlightedIndex(i)}
            key={i}
            role="option"
            data-testid={`${testId}-option-${option.koodiArvo}`}>
            {option.nimi}
          </li>
        ))}
      </ul>
    </div>
  )
}
