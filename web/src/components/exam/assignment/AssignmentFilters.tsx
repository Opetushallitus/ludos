import { Dispatch, SetStateAction, useContext, useState } from 'react'
import { FiltersType } from '../../../hooks/useFilters'
import { Dropdown } from '../../Dropdown'
import { LANGUAGE_OPTIONS, SUKO_ASSIGNMENT_OPTIONS, SUKO_ASSIGNMENT_ORDER_OPTIONS } from '../../../koodisto'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn, Koodisto, KoodistoContext, KoodistoMap } from '../../../KoodistoContext'
import { MultiSelectDropdown } from '../../MultiSelectDropdown'

type ValueOf<T> = T[keyof T]

type AssignmentFiltersProps = {
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
  language: string
  setLanguage: Dispatch<SetStateAction<string>>
  setIsMultiselectOpen: (bool: boolean) => void
}

export const AssignmentFilters = ({
  filters,
  setFilters,
  language,
  setLanguage,
  setIsMultiselectOpen
}: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)

  const koodisto = ctx.koodistos

  const handleFilterChange = (key: keyof FiltersType, value: ValueOf<FiltersType>) =>
    setFilters((curr) => ({ ...curr, [key]: value }))

  const handleMultiselectFilterChange = (key: keyof FiltersType, value: KoodiDtoIn[]) => {
    setFilters((curr) => ({ ...curr, [key]: value.map((it) => it.koodiArvo) }))
  }

  const getSelectedOptions = (koodisto?: Koodisto) =>
    koodisto?.koodit.filter((koodi) => filters.oppimaara?.includes(koodi.koodiArvo)) || []

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row w-full flex-wrap justify-start">
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.oppimaara')}</p>
          <MultiSelectDropdown
            options={koodisto?.oppiaineetjaoppimaaratlops2021?.koodit || []}
            selectedOptions={getSelectedOptions(koodisto?.oppiaineetjaoppimaaratlops2021)}
            onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('oppimaara', opt)}
            onOpen={setIsMultiselectOpen}
            onClose={() => setIsMultiselectOpen(false)}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.tyyppi')}</p>
          <MultiSelectDropdown
            options={koodisto?.ludostehtavatyypi?.koodit || []}
            selectedOptions={getSelectedOptions(koodisto?.ludostehtavatyypi)}
            onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('assignmentType', opt)}
            onOpen={setIsMultiselectOpen}
            onClose={() => setIsMultiselectOpen(false)}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.aihe')}</p>
          <Dropdown
            currentOption={null}
            onOptionClick={(opt) => handleFilterChange('aihe', opt)}
            options={[]}
            canReset
          />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">{t('filter.kieli')}</p>
          <Dropdown
            currentOption={LANGUAGE_OPTIONS.find((opt) => opt.key === language)?.value || null}
            onOptionClick={(opt: string) => setLanguage(opt)}
            options={LANGUAGE_OPTIONS}
          />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">{t('filter.jarjesta')}</p>
          <Dropdown
            currentOption={
              SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.key === filters.orderDirection)?.value || null
            }
            onOptionClick={(opt: ValueOf<FiltersType>) => handleFilterChange('orderDirection', opt)}
            options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
          />
        </div>
      </div>
    </div>
  )
}
