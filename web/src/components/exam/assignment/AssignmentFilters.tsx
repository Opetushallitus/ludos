import { useCallback, useMemo } from 'react'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { useTranslation } from 'react-i18next'
import { AssignmentFilterOptions, Exam } from '../../../types'
import {
  KoodiDtoOut,
  Oppimaara,
  oppimaaraFromId,
  sortKooditAlphabetically,
  useKoodisto
} from '../../../hooks/useKoodisto'
import { LudosSelect, LudosSelectOption } from '../../ludosSelect/LudosSelect'
import {
  currentKoodistoSelectOptions,
  currentOppimaaraSelectOptions,
  koodistoSelectOptions,
  oppimaaraSelectOptions
} from '../../ludosSelect/helpers'
import { MultiValue } from 'react-select'

type AssignmentFiltersProps = {
  exam: Exam
  filterValues: {
    filterValues: FiltersType
    setFilterValue: (key: keyof FiltersType, value: ParamsValue, replace: boolean) => void
  }
  assignmentFilterOptions: AssignmentFilterOptions
}

const getFilteredOptions = (allOptions: Record<string, KoodiDtoOut>, overrides?: string[]) =>
  overrides ? Object.values(allOptions).filter((it) => overrides.includes(it.koodiArvo)) : Object.values(allOptions)

export const AssignmentFilters = ({
  exam,
  filterValues: { filterValues, setFilterValue },
  assignmentFilterOptions: { oppimaara, aihe, tehtavatyyppi, lukuvuosi, aine }
}: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const { koodistos, getKoodiLabel, getOppimaaraLabel } = useKoodisto()

  const handleMultiselectFilterChange = useCallback(
    (key: keyof FiltersType, value: MultiValue<LudosSelectOption>) => {
      setFilterValue(
        key,
        value.map((it) => it.value),
        true
      )
    },
    [setFilterValue]
  )

  const oppimaaraOptions = useMemo(() => {
    const actualOptions = oppimaara || []
    const oppimaaraKoodiarvosWithTarkenteet = [
      ...new Set(actualOptions.filter((o) => o.kielitarjontaKoodiArvo !== null).map((o) => o.oppimaaraKoodiArvo))
    ]
    const oppimaaraKoodiArvosWithMissingHeaders = [
      ...new Set(
        oppimaaraKoodiarvosWithTarkenteet.filter(
          (oppimaaraKoodiArvo) =>
            !actualOptions.find(
              (io) => io.oppimaaraKoodiArvo === oppimaaraKoodiArvo && io.kielitarjontaKoodiArvo === null
            )
        )
      )
    ]
    const missingParentOppimaaras: Oppimaara[] = oppimaaraKoodiArvosWithMissingHeaders.map((oppimaaraKoodiArvo) => ({
      oppimaaraKoodiArvo,
      kielitarjontaKoodiArvo: null
    }))
    return [...actualOptions, ...missingParentOppimaaras]
  }, [oppimaara])

  const tehtavaTyyppiOptions = () => getFilteredOptions(koodistos.tehtavatyyppisuko, tehtavatyyppi)
  const aiheOptions = () => getFilteredOptions(koodistos.aihesuko, aihe)
  const lukuvuosiOptions = () => getFilteredOptions(koodistos.ludoslukuvuosi, lukuvuosi)
  const lukiodiplomiaineOptions = () => getFilteredOptions(koodistos.ludoslukiodiplomiaine, aine)
  const tehavatyyppipuhviOptions = () => getFilteredOptions(koodistos.tehtavatyyppipuhvi, tehtavatyyppi)

  return (
    <div className="border border-gray-light bg-gray-bg">
      <p className="px-2 py-1">{t('filter.otsikko')}</p>
      <div className="row flex-wrap justify-start pb-2">
        {exam === Exam.SUKO && (
          <>
            <div className="w-full px-2 md:w-6/12 lg:w-3/12">
              <p>{t('filter.oppimaara')}</p>
              <LudosSelect
                name="oppimaaraFilter"
                menuSize="lg"
                options={oppimaaraSelectOptions(oppimaaraOptions, getKoodiLabel)}
                value={currentOppimaaraSelectOptions(filterValues.oppimaara?.map(oppimaaraFromId), getOppimaaraLabel)}
                onChange={(opt) => handleMultiselectFilterChange('oppimaara', opt)}
                isMulti
                isSearchable
              />
            </div>
            <div className="w-full px-2 md:w-6/12 lg:w-3/12">
              <p>{t('filter.tyyppi')}</p>
              <LudosSelect
                name="contentTypeFilter"
                menuSize="md"
                options={koodistoSelectOptions(sortKooditAlphabetically(tehtavaTyyppiOptions()))}
                value={currentKoodistoSelectOptions(filterValues.tehtavatyyppisuko, koodistos['tehtavatyyppisuko'])}
                onChange={(opt) => handleMultiselectFilterChange('tehtavatyyppisuko', opt)}
                isMulti
                isSearchable
              />
            </div>
            <div className="w-full px-2 lg:w-3/12">
              <p>{t('filter.aihe')}</p>
              <LudosSelect
                name="aiheFilter"
                menuSize="md"
                options={koodistoSelectOptions(sortKooditAlphabetically(aiheOptions()))}
                value={currentKoodistoSelectOptions(filterValues.aihe, koodistos['aihesuko'])}
                onChange={(opt) => handleMultiselectFilterChange('aihe', opt)}
                isMulti
                isSearchable
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
            <LudosSelect
              name="lukuvuosiFilter"
              options={koodistoSelectOptions(sortKooditAlphabetically(lukuvuosiOptions()))}
              value={currentKoodistoSelectOptions(filterValues.lukuvuosi, koodistos['ludoslukuvuosi'])}
              onChange={(opt) => handleMultiselectFilterChange('lukuvuosi', opt)}
              isMulti
              isSearchable
            />
          </div>
        )}
        {exam === Exam.LD && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.aine')}</p>
            <LudosSelect
              name="aineFilter"
              options={koodistoSelectOptions(sortKooditAlphabetically(lukiodiplomiaineOptions()))}
              value={currentKoodistoSelectOptions(filterValues.aine, koodistos['ludoslukiodiplomiaine'])}
              onChange={(opt) => handleMultiselectFilterChange('aine', opt)}
              isMulti
              isSearchable
            />
          </div>
        )}
        {exam === Exam.PUHVI && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.tehtavatyyppi')}</p>
            <LudosSelect
              name="tehtavatyyppiPuhviFilter"
              options={koodistoSelectOptions(sortKooditAlphabetically(tehavatyyppipuhviOptions()))}
              value={currentKoodistoSelectOptions(filterValues.tehtavatyyppipuhvi, koodistos['tehtavatyyppipuhvi'])}
              onChange={(opt) => handleMultiselectFilterChange('tehtavatyyppipuhvi', opt)}
              isMulti
              isSearchable
            />
          </div>
        )}
      </div>
    </div>
  )
}
