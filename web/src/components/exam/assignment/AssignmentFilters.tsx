import { useCallback } from 'react'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { sortKooditAlphabetically } from '../../../koodistoUtils'
import { useTranslation } from 'react-i18next'
import { KoodiDtoIn } from '../../../LudosContext'
import { MultiSelectDropdown } from '../../MultiSelectDropdown'
import { useFetch } from '../../../hooks/useFetch'
import { Exam } from '../../../types'
import { useKoodisto } from '../../../hooks/useKoodisto'

type AssignmentFiltersProps = {
  exam: Exam
  filterValues: FiltersType
  setFilterValue: (key: keyof FiltersType, value: ParamsValue) => void
  oppimaaraOptionsOverride?: string[]
  tehtavaTyyppiOptionsOverride?: string[]
  aiheOptionsOverride?: string[]
  lukuvuosiOptionsOverride?: string[]
  lukiodiplomiaineOptionsOverride?: string[]
  tehavatyyppipuhviOptionsOverride?: string[]
}

const getFilteredOptions = (allOptions: KoodiDtoIn[], overrides?: string[]) =>
  overrides ? allOptions.filter((it) => overrides.includes(it.koodiArvo)) : allOptions

export const AssignmentFilters = ({
  exam,
  filterValues,
  setFilterValue,
  oppimaaraOptionsOverride,
  tehtavaTyyppiOptionsOverride,
  aiheOptionsOverride,
  lukuvuosiOptionsOverride,
  lukiodiplomiaineOptionsOverride,
  tehavatyyppipuhviOptionsOverride
}: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const { koodistos, getSelectedOptions } = useKoodisto()

  const { data: oppimaaras } = useFetch<string[]>('assignment/oppimaaras')

  const handleMultiselectFilterChange = useCallback(
    (key: keyof FiltersType, value: KoodiDtoIn[]) => {
      setFilterValue(
        key,
        value.map((it) => it.koodiArvo)
      )
    },
    [setFilterValue]
  )

  const oppimaaraOptions = (): KoodiDtoIn[] => {
    const { oppiaineetjaoppimaaratlops2021 } = koodistos

    if (!oppimaaras) {
      return oppiaineetjaoppimaaratlops2021
    }

    const filterCriteria = oppimaaraOptionsOverride || oppimaaras

    return oppiaineetjaoppimaaratlops2021.filter((it) => filterCriteria.includes(it.koodiArvo))
  }

  const tehtavaTyyppiOptions = () => getFilteredOptions(koodistos.tehtavatyyppisuko, tehtavaTyyppiOptionsOverride)
  const aiheOptions = () => getFilteredOptions(koodistos.aihesuko, aiheOptionsOverride)
  const lukuvuosiOptions = () => getFilteredOptions(koodistos.ludoslukuvuosi, lukuvuosiOptionsOverride)
  const lukiodiplomiaineOptions = () =>
    getFilteredOptions(koodistos.ludoslukiodiplomiaine, lukiodiplomiaineOptionsOverride)
  const tehavatyyppipuhviOptions = () =>
    getFilteredOptions(koodistos.tehtavatyyppipuhvi, tehavatyyppipuhviOptionsOverride)

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row flex-wrap justify-start">
        {exam === Exam.SUKO && (
          <>
            <div className="w-full px-2 md:w-6/12 lg:w-3/12">
              <label htmlFor="oppimaaraFilter">{t('filter.oppimaara')}</label>
              <MultiSelectDropdown
                id="oppimaaraFilter"
                options={sortKooditAlphabetically(oppimaaraOptions())}
                size="lg"
                selectedOptions={getSelectedOptions(filterValues.oppimaara, 'oppiaineetjaoppimaaratlops2021')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('oppimaara', opt)}
                testId="oppimaara"
                canReset
              />
            </div>
            <div className="w-full px-2 md:w-6/12 lg:w-3/12">
              <p>{t('filter.tyyppi')}</p>
              <MultiSelectDropdown
                id="contentTypeFilter"
                options={sortKooditAlphabetically(tehtavaTyyppiOptions())}
                size="md"
                selectedOptions={getSelectedOptions(filterValues.tehtavatyyppisuko, 'tehtavatyyppisuko')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tehtavatyyppisuko', opt)}
                testId="contentType"
                canReset
              />
            </div>
            <div className="w-full px-2 lg:w-3/12">
              <p>{t('filter.aihe')}</p>
              <MultiSelectDropdown
                id="aihe"
                options={sortKooditAlphabetically(aiheOptions())}
                size="md"
                selectedOptions={getSelectedOptions(filterValues.aihe, 'aihesuko')}
                onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('aihe', opt)}
                canReset
              />
            </div>
            {/* OPHLUDOS-125: https://jira.eduuni.fi/browse/OPHLUDOS-125 */}
            {/*<div className="w-full px-2 md:w-6/12 lg:w-3/12">*/}
            {/*  <p>{t('filter.tavoitetaso')}</p>*/}
            {/*  <MultiSelectDropdown*/}
            {/*    id="tavoitetaitotaso"*/}
            {/*    options={sortKooditByArvo(koodistos.taitotaso || [])}*/}
            {/*size="md"*/}
            {/*    selectedOptions={getSelectedOptions(filters.tavoitetaitotaso, 'taitotaso')}*/}
            {/*    onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tavoitetaitotaso', opt)}*/}
            {/*    canReset*/}
            {/*  />*/}
            {/*</div>*/}
          </>
        )}
        {(exam === Exam.LD || exam === Exam.PUHVI) && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.lukuvuosi')}</p>
            <MultiSelectDropdown
              id="lukuvuosi"
              options={sortKooditAlphabetically(lukuvuosiOptions())}
              selectedOptions={getSelectedOptions(filterValues.lukuvuosi, 'ludoslukuvuosi')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('lukuvuosi', opt)}
              canReset
            />
          </div>
        )}
        {exam === Exam.LD && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.aine')}</p>
            <MultiSelectDropdown
              id="aine"
              options={sortKooditAlphabetically(lukiodiplomiaineOptions())}
              selectedOptions={getSelectedOptions(filterValues.aine, 'ludoslukiodiplomiaine')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('aine', opt)}
              canReset
            />
          </div>
        )}
        {exam === Exam.PUHVI && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.tehtavatyyppi')}</p>
            <MultiSelectDropdown
              id="tehtavatyyppiPuhvi"
              options={sortKooditAlphabetically(tehavatyyppipuhviOptions())}
              selectedOptions={getSelectedOptions(filterValues.tehtavatyyppipuhvi, 'tehtavatyyppipuhvi')}
              onSelectedOptionsChange={(opt) => handleMultiselectFilterChange('tehtavatyyppipuhvi', opt)}
              canReset
            />
          </div>
        )}
      </div>
    </div>
  )
}
