import { ChangeEvent, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useDropdown } from '../hooks/useDropdown'
import { KoodiDtoIn } from '../LudosContext'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { twMerge } from 'tailwind-merge'

type MultiSelectProps = {
  id: string
  options: KoodiDtoIn[]
  selectedOptions: KoodiDtoIn[]
  onSelectedOptionsChange: (options: KoodiDtoIn[]) => void
  size?: 'md' | 'lg'
  testId?: string
  canReset?: boolean
  requiredError?: boolean
}

export const MultiSelectDropdown = ({
  id,
  options,
  selectedOptions,
  onSelectedOptionsChange,
  size,
  testId = id,
  canReset = false,
  requiredError
}: MultiSelectProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchText, setSearchText] = useState<string>('')

  const filteredOptions = options.filter((option) => option.nimi.toLowerCase().includes(searchText.toLowerCase()))

  const { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption, closeModal } = useDropdown({
    options: filteredOptions,
    selectedOptions,
    onSelectedOptionsChange: (opt) => {
      if (opt instanceof Array) {
        onSelectedOptionsChange(opt)
      }
    },
    containerRef,
    inputRef
  })

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isOpen) {
      setIsOpen(true)
    }
    setSearchText(event.target.value)
  }

  return (
    <div className="relative mb-3 mt-1 border border-gray-border" ref={containerRef} tabIndex={0}>
      <div className={twMerge('flex bg-white px-2', requiredError && 'border border-red-primary')} data-testid={testId}>
        <Button
          variant="buttonGhost"
          customClass="p-0 m-0"
          id={id}
          className="row w-full flex-wrap gap-2 py-1"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(true)
          }}
          tabIndex={0}
          aria-label={`Open ${id} Dropdown`}>
          <input
            id={`${id}-search-input`}
            type="search"
            value={searchText}
            onChange={handleSearchChange}
            placeholder={t('filter.valitse') as string}
            className="w-full rounded-md"
            ref={inputRef}
            data-testid={`${testId}-input`}
          />
          {selectedOptions.length > 0 && (
            <>
              {selectedOptions.map((opt, i) => (
                <div
                  className="flex w-auto flex-col rounded-2xl bg-green-primary"
                  key={i}
                  data-testid={`selected-option-${testId}`}>
                  <div className="my-auto flex items-center">
                    <p className="px-2 py-1 text-center text-xs text-white">{opt.nimi}</p>
                    <Button
                      variant="buttonGhost"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOption(opt)
                      }}
                      customClass="p-0 mr-2 hover:cursor-pointer hover:bg-white"
                      data-testid={`${testId}-remove-selected-option`}>
                      <Icon name="sulje" color="text-white" customClass="hover:text-black" size="sm" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </Button>
        <div className="mt-1">
          {selectedOptions.length > 0 && canReset ? (
            <Button
              variant="buttonGhost"
              customClass="p-0 border-l-2 border-gray-light hover:cursor-pointer hover:bg-gray-active"
              onClick={(e) => {
                e.stopPropagation()
                onSelectedOptionsChange([])
                setSearchText('')
              }}
              data-testid={`${testId}-reset-selected-options`}>
              <Icon name="sulje" color="text-black" />
            </Button>
          ) : (
            <Button
              variant="buttonGhost"
              customClass="p-0 hover:cursor-pointer hover:bg-gray-active"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(true)
              }}
              data-testid={`${testId}-expand-dropdown-icon`}>
              <Icon name="laajenna" color="text-black" />
            </Button>
          )}
        </div>
      </div>
      <div className={twMerge('absolute z-50 min-w-full border border-gray-border bg-white py-1', !isOpen && 'hidden')}>
        <ul className={twMerge('max-h-96 min-w-full overflow-y-auto', size === 'md' ? 'dropdown-md' : 'dropdown-lg')}>
          {filteredOptions.map((option, i) => (
            <li
              className={twMerge(
                'cursor-pointer px-3',
                selectedOptions.includes(option) && ' bg-green-primary text-white hover:text-white',
                i === highlightedIndex && selectedOptions.includes(option)
                  ? 'bg-green-light'
                  : i === highlightedIndex && 'bg-gray-light'
              )}
              role="option"
              onClick={() => {
                toggleOption(option)
                setSearchText('')
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
              key={i}
              data-testid={`${testId}-option-${option.koodiArvo}`}>
              {option.nimi}
            </li>
          ))}
        </ul>
        <div className="mt-1 flex justify-end border-t border-gray-border p-2">
          <Button variant="buttonPrimary" onClick={closeModal} data-testid={`${testId}-multi-select-ready-button`}>
            {t('button.valmis')}
          </Button>
        </div>
      </div>
    </div>
  )
}
