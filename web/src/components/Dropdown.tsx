import { useRef } from 'react'
import { Icon } from './Icon'
import { useDropdown } from '../hooks/useDropdown'
import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { twMerge } from 'tailwind-merge'

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
    <div className="relative mb-3 mt-1 border border-gray-border" ref={containerRef} tabIndex={0}>
      <div className="row justify-between bg-white w-full">
        <Button
          variant="buttonGhost"
          customClass={twMerge(`px-2 py-0 w-full`, requiredError && 'border border-red-primary')}
          id={id}
          aria-label={`Open ${id} Dropdown`}
          aria-expanded={isOpen}
          aria-activedescendant={selectedOption?.nimi && `${id}-${selectedOption?.nimi}`}
          onClick={() => setIsOpen(!isOpen)}
          data-testid={testId}>
          <div className="row w-full flex-wrap gap-2 py-1">
            {selectedOption ? (
              <div className="flex w-auto flex-col">
                <div className="my-auto flex items-center">{selectedOption.nimi}</div>
              </div>
            ) : (
              <span className="text-gray-secondary">{t('filter.valitse')}</span>
            )}
          </div>
        </Button>
        <div className="mt-1 pr-2">
          {selectedOption && canReset ? (
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
            <Button
              variant="buttonGhost"
              customClass="p-0 hover:cursor-pointer hover:bg-gray-active"
              onClick={() => setIsOpen(true)}>
              <Icon name="laajenna" color="text-black" />
            </Button>
          )}
        </div>
      </div>
      <ul
        className={`${
          isOpen ? '' : 'hidden'
        } absolute z-50 max-h-96 min-w-full overflow-y-auto border border-gray-border bg-white py-1`}
        role="listbox"
        aria-labelledby={id}>
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
            aria-selected={selectedOption === option}
            role="option"
            data-testid={`${testId}-option-${option.koodiArvo}`}>
            {option.nimi}
          </li>
        ))}
      </ul>
    </div>
  )
}
