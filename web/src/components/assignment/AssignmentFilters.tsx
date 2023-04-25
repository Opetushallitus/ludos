import { Dispatch, SetStateAction, useState } from 'react'
import { FiltersType } from './useFilters'
import { Dropdown } from '../Dropdown'
import { SUKO_ASSIGNMENT_OPTIONS, SUKO_ASSIGNMENT_ORDER_OPTIONS } from '../../koodisto'

const defaultExpandedState = {
  course: false,
  assignmentType: false,
  topic: false,
  language: false,
  order: false
}

type ValueOf<T> = T[keyof T]

type AssignmentFiltersProps = {
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
}

export const AssignmentFilters = ({ filters, setFilters }: AssignmentFiltersProps) => {
  const [isExpanded, setExpansion] = useState(defaultExpandedState)

  const handleDropdownClick = (dropdownName: keyof typeof defaultExpandedState, bool: boolean) => {
    setExpansion(defaultExpandedState)
    setExpansion((curr) => ({ ...curr, [dropdownName]: bool }))
  }

  const handleFilterChange = (key: keyof FiltersType, value: ValueOf<FiltersType>) =>
    setFilters((curr) => ({ ...curr, [key]: value }))

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">Suodata tehtäviä</p>
      <div className="row w-full flex-wrap justify-start">
        <div className="w-full md:w-56">
          <p className="pl-2">Oppimäärä</p>
          <Dropdown
            currentOption={filters.course}
            isExpanded={isExpanded.course}
            setExpansion={(bool) => handleDropdownClick('course', bool)}
            onOptionClick={(opt) => handleFilterChange('course', opt)}
            options={[]}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">Tehtävätyyppi</p>
          <Dropdown
            currentOption={SUKO_ASSIGNMENT_OPTIONS.find((opt) => opt.key === filters.assignmentType)?.value || null}
            isExpanded={isExpanded.assignmentType}
            setExpansion={(bool) => handleDropdownClick('assignmentType', bool)}
            onOptionClick={(opt) => handleFilterChange('assignmentType', opt)}
            options={SUKO_ASSIGNMENT_OPTIONS}
          />
        </div>
        <div className="w-full md:w-56">
          <p className="pl-2">Aihe</p>
          <Dropdown
            currentOption={null}
            isExpanded={isExpanded.topic}
            setExpansion={(bool) => handleDropdownClick('topic', bool)}
            onOptionClick={(opt) => handleFilterChange('topic', opt)}
            options={[]}
          />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">Tehtävän kieli</p>
          <Dropdown
            currentOption={null}
            isExpanded={isExpanded.language}
            setExpansion={(bool) => handleDropdownClick('language', bool)}
            onOptionClick={(opt) => handleFilterChange('language', opt)}
            options={[]}
          />
        </div>
        <div className="w-full md:w-40">
          <p className="pl-2">Järjestä</p>
          <Dropdown
            currentOption={
              SUKO_ASSIGNMENT_ORDER_OPTIONS.find((opt) => opt.key === filters.orderDirection)?.value || null
            }
            isExpanded={isExpanded.order}
            setExpansion={(bool) => handleDropdownClick('order', bool)}
            onOptionClick={(opt) => handleFilterChange('orderDirection', opt)}
            options={SUKO_ASSIGNMENT_ORDER_OPTIONS}
          />
        </div>
      </div>
    </div>
  )
}
