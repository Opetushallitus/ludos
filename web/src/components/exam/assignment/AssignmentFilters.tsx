import { Dispatch, SetStateAction, useContext } from 'react'
import { FiltersType } from '../../../hooks/useFilters'
import { Dropdown } from '../../Dropdown'
import { LANGUAGE_OPTIONS, sortKoodit, SUKO_ASSIGNMENT_ORDER_OPTIONS } from '../../../koodistoUtils'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn, KoodistoContext } from '../../../KoodistoContext'
import { MultiSelectDropdown } from '../../MultiSelectDropdown'

type ValueOf<T> = T[keyof T]

type AssignmentFiltersProps = {
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
  language: string
  setLanguage: Dispatch<SetStateAction<string>>
}

export const AssignmentFilters = ({ filters, setFilters, language, setLanguage }: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)

  const koodisto = ctx.koodistos

  const handleFilterChange = <T,>(key: keyof FiltersType, value: T) => setFilters((curr) => ({ ...curr, [key]: value }))

  const handleMultiselectFilterChange = (key: keyof FiltersType, value: KoodiDtoIn[]) => {
    setFilters((curr) => ({ ...curr, [key]: value.map((it) => it.koodiArvo) }))
  }

  const getSelectedOptions = (filter: string[] | null, koodisto: KoodiDtoIn[]) =>
    koodisto.filter((koodi) => filter?.includes(koodi.koodiArvo)) || []

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row w-full flex-wrap justify-start">
        <div className="mx-2 w-full md:w-[23%]">
          <p>{t('filter.oppimaara')}</p>
          <MultiSelectDropdown
            id="oppimaaraFilter"
            options={sortKoodit(koodisto.oppiaineetjaoppimaaratlops2021 || [])}
            selectedOptions={getSelectedOptions(filters.oppimaara, koodisto.oppiaineetjaoppimaaratlops2021)}
            onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('oppimaara', opt)}
            canReset
          />
        </div>
        <div className="mx-2 w-full md:w-[23%]">
          <p>{t('filter.tyyppi')}</p>
          <MultiSelectDropdown
            id="contentTypeFilter"
            options={sortKoodit(koodisto.tehtavatyyppisuko || [])}
            selectedOptions={getSelectedOptions(filters.assignmentTypeKoodiArvo, koodisto.tehtavatyyppisuko)}
            onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('assignmentTypeKoodiArvo', opt)}
            canReset
          />
        </div>
        <div className="mx-2 w-full md:w-[23%]">
          <p>{t('filter.aihe')}</p>
          <Dropdown
            id="aiheFilter"
            onSelectedOptionsChange={(opt) => handleFilterChange('aihe', opt)}
            options={[]}
            canReset
          />
        </div>
        <div className="mx-2 w-full md:w-[15%] md:min-w-[10rem]">
          <p>{t('filter.kieli')}</p>
          <Dropdown
            id="languageDropdown"
            options={LANGUAGE_OPTIONS}
            selectedOption={LANGUAGE_OPTIONS.find((opt) => opt.koodiArvo === language)}
            onSelectedOptionsChange={(opt: string) => setLanguage(opt)}
            testId="language-dropdown"
          />
        </div>
        <div className="mx-2 w-full md:w-[15%] md:min-w-[10rem]">
          <p>{t('filter.jarjesta')}</p>
          <Dropdown
            id="orderFilter"
            options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
            selectedOption={SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.koodiArvo === filters.orderDirection)}
            onSelectedOptionsChange={(opt: string) =>
              handleFilterChange<ValueOf<FiltersType['orderDirection']>>('orderDirection', opt)
            }
          />
        </div>
      </div>
    </div>
  )
}
