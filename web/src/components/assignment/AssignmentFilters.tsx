import { Dispatch, SetStateAction } from 'react'
import { FiltersType } from '../../hooks/useFilters'
import { Dropdown } from '../Dropdown'
import { SUKO_ASSIGNMENT_OPTIONS, SUKO_ASSIGNMENT_ORDER_OPTIONS } from '../../koodisto'
import { useTranslation } from 'react-i18next'

type ValueOf<T> = T[keyof T]

type AssignmentFiltersProps = {
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
}

export const AssignmentFilters = ({ filters, setFilters }: AssignmentFiltersProps) => {
  const { t } = useTranslation()

  const handleFilterChange = (key: keyof FiltersType, value: ValueOf<FiltersType>) =>
    setFilters((curr) => ({ ...curr, [key]: value }))

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row w-full flex-wrap justify-start">
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.oppimaara')}</p>
          <Dropdown
            currentOption={filters.course}
            onOptionClick={(opt) => handleFilterChange('course', opt)}
            options={[]}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.tyyppi')}</p>
          <Dropdown
            currentOption={SUKO_ASSIGNMENT_OPTIONS.find((opt) => opt.key === filters.assignmentType)?.value || null}
            onOptionClick={(opt) => handleFilterChange('assignmentType', opt)}
            options={SUKO_ASSIGNMENT_OPTIONS}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">{t('filter.aihe')}</p>
          <Dropdown currentOption={null} onOptionClick={(opt) => handleFilterChange('topic', opt)} options={[]} />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">{t('filter.kieli')}</p>
          <Dropdown
            currentOption={null}
            onOptionClick={(opt) => handleFilterChange('language', opt)}
            options={[]}
            canReset={false}
          />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">{t('filter.jarjesta')}</p>
          <Dropdown
            currentOption={
              SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.key === filters.orderDirection)?.value || null
            }
            onOptionClick={(opt) => handleFilterChange('orderDirection', opt)}
            options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
            canReset={false}
          />
        </div>
      </div>
    </div>
  )
}
