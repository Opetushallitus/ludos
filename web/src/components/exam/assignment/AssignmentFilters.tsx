import { Dispatch, SetStateAction } from 'react'
import { FiltersType } from '../../../hooks/useFilters'
import { sortKooditAlphabetically, sortKooditByArvo } from '../../../koodistoUtils'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../LudosContext'
import { MultiSelectDropdown } from '../../MultiSelectDropdown'
import { useFetch } from '../../../hooks/useFetch'
import { Exam } from '../../../types'
import { useKoodisto } from '../../../hooks/useKoodisto'

type AssignmentFiltersProps = {
  exam: Exam
  filters: FiltersType
  setFilters: Dispatch<SetStateAction<FiltersType>>
}

export const AssignmentFilters = ({ exam, filters, setFilters }: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const { koodistos, getSelectedOptions } = useKoodisto()

  const { data } = useFetch<string[]>('assignment/oppimaaras')

  const handleMultiselectFilterChange = (key: keyof FiltersType, value: KoodiDtoIn[]) => {
    setFilters((curr) => ({ ...curr, [key]: value.map((it) => it.koodiArvo) }))
  }

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row flex-wrap justify-start">
        {exam === Exam.Suko && (
          <>
            <div className="w-full px-2 md:w-3/12">
              <p>{t('filter.oppimaara')}</p>
              <MultiSelectDropdown
                id="oppimaaraFilter"
                options={
                  data
                    ? sortKooditAlphabetically(
                        koodistos.oppiaineetjaoppimaaratlops2021.filter((it) => data.includes(it.koodiArvo))
                      )
                    : []
                }
                selectedOptions={getSelectedOptions(filters.oppimaara, 'oppiaineetjaoppimaaratlops2021')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('oppimaara', opt)}
                testId="oppimaara"
                canReset
              />
            </div>
            <div className="w-full px-2 md:w-3/12">
              <p>{t('filter.tyyppi')}</p>
              <MultiSelectDropdown
                id="contentTypeFilter"
                options={sortKooditAlphabetically(koodistos.tehtavatyyppisuko || [])}
                selectedOptions={getSelectedOptions(filters.tehtavatyyppisuko, 'tehtavatyyppisuko')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tehtavatyyppisuko', opt)}
                testId="contentType"
                canReset
              />
            </div>
            <div className="w-full px-2 md:w-3/12">
              <p>{t('filter.aihe')}</p>
              <MultiSelectDropdown
                id="aihe"
                options={sortKooditAlphabetically(koodistos.aihesuko)}
                selectedOptions={getSelectedOptions(filters.aihe, 'aihesuko')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('aihe', opt)}
                canReset
              />
            </div>
            {/* OPHLUDOS-125: https://jira.eduuni.fi/browse/OPHLUDOS-125 */}
            {/*<div className="w-full px-2 md:w-3/12">*/}
            {/*  <p>{t('filter.tavoitetaso')}</p>*/}
            {/*  <MultiSelectDropdown*/}
            {/*    id="tavoitetaitotaso"*/}
            {/*    options={sortKooditByArvo(koodistos.taitotaso || [])}*/}
            {/*    selectedOptions={getSelectedOptions(filters.tavoitetaitotaso, 'taitotaso')}*/}
            {/*    onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tavoitetaitotaso', opt)}*/}
            {/*    canReset*/}
            {/*  />*/}
            {/*</div>*/}
          </>
        )}
        {(exam === Exam.Ld || exam === Exam.Puhvi) && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.lukuvuosi')}</p>
            <MultiSelectDropdown
              id="lukuvuosi"
              options={sortKooditAlphabetically(koodistos.ludoslukuvuosi || [])}
              selectedOptions={getSelectedOptions(filters.lukuvuosi, 'ludoslukuvuosi')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('lukuvuosi', opt)}
              canReset
            />
          </div>
        )}
        {exam === Exam.Ld && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.aine')}</p>
            <MultiSelectDropdown
              id="aine"
              options={sortKooditAlphabetically(koodistos.ludoslukiodiplomiaine || [])}
              selectedOptions={getSelectedOptions(filters.aine, 'ludoslukiodiplomiaine')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('aine', opt)}
              canReset
            />
          </div>
        )}
        {exam === Exam.Puhvi && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.tehtavatyyppi')}</p>
            <MultiSelectDropdown
              id="tehtavatyyppiPuhvi"
              options={sortKooditAlphabetically(koodistos.tehtavatyyppipuhvi || [])}
              selectedOptions={getSelectedOptions(filters.tehtavatyyppipuhvi, 'tehtavatyyppipuhvi')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tehtavatyyppipuhvi', opt)}
              canReset
            />
          </div>
        )}
      </div>
    </div>
  )
}
