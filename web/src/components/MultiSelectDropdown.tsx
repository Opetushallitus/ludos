import { ChangeEvent, useRef, useState } from 'react'
import { Icon } from './Icon'
import { useDropdown } from '../hooks/useDropdown'
import { KoodiDtoIn } from '../KoodistoContext'

type MultiSelectProps = {
  id: string
  options: KoodiDtoIn[]
  selectedOptions: KoodiDtoIn[]
  onSelectedOptionsChange: (options: KoodiDtoIn[]) => void
  testId?: string
  canReset?: boolean
}

export const MultiSelectDropdown = ({
  id,
  options,
  selectedOptions,
  onSelectedOptionsChange,
  testId,
  canReset = false
}: MultiSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchText, setSearchText] = useState<string>('')

  const filteredOptions = options.filter((option) => option.nimi.toLowerCase().includes(searchText.toLowerCase()))

  const { isOpen, setIsOpen, highlightedIndex, setHighlightedIndex, toggleOption } = useDropdown({
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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => setSearchText(event.target.value)

  return (
    <div
      className="relative mb-3 mt-1 border border-gray-secondary"
      ref={containerRef}
      onClick={() => setIsOpen(true)}
      tabIndex={0}>
      <div id={id} className="flex bg-white px-2" role="button" data-testid={testId}>
        <div className="row w-full flex-wrap gap-2 py-1">
          {selectedOptions.length > 0 && (
            <>
              {selectedOptions.map((opt, i) => (
                <div
                  className="flex w-auto flex-col rounded-2xl bg-green-primary"
                  key={i}
                  data-testid={`selected-option-${testId}`}>
                  <div className="my-auto flex items-center">
                    <p className="px-2 py-1 text-center text-xs text-white">{opt.nimi}</p>
                    <Icon
                      name="sulje"
                      color="text-white"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOption(opt)
                      }}
                      dataTestId="remove-selected-option"
                      customClass="hover:cursor-pointer hover:bg-white hover:text-black mr-3"
                    />
                  </div>
                </div>
              ))}
            </>
          )}
          <input
            type="search"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Valitse.." // todo: localize
            className="w-10/12 rounded-md"
            ref={inputRef}
            data-testid={`${testId}-input`}
          />
        </div>
        <div className="mt-1">
          {selectedOptions.length > 0 && canReset ? (
            <Icon
              name="sulje"
              color="text-black"
              onClick={(e) => {
                e.stopPropagation()
                onSelectedOptionsChange([])
                setSearchText('')
              }}
              customClass="border-l-2 border-gray-light"
              dataTestId="reset-selected-options"
            />
          ) : (
            <Icon name="laajenna" color="text-black" />
          )}
        </div>
      </div>
      <ul className={`${isOpen ? '' : 'hidden'} dropdownContent`}>
        {filteredOptions.map((option, i) => (
          <li
            className={`cursor-pointer px-3 ${
              selectedOptions.includes(option) ? 'bg-green-primary text-white hover:text-white' : ''
            } ${
              i === highlightedIndex && selectedOptions.includes(option)
                ? '!bg-green-light'
                : i === highlightedIndex
                ? 'bg-gray-light'
                : ''
            }`}
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
    </div>
  )
}
