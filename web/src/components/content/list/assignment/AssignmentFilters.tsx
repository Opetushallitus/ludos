import { useCallback } from 'react'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { useTranslation } from 'react-i18next'
import { AssignmentFilterOptions, Exam, Oppimaara, oppimaaraFromId } from '../../../../types'
import { koodisOrDefaultLabel, useKoodisto } from '../../../../hooks/useKoodisto'
import { LudosSelect, LudosSelectOption } from '../../../ludosSelect/LudosSelect'
import {
  currentKoodistoSelectOption,
  currentOppimaaraSelectOption,
  koodistoSelectOptions,
  oppimaaraSelectOptions
} from '../../../ludosSelect/helpers'
import { SingleValue } from 'react-select'
import { Button } from '../../../Button'

type AssignmentFiltersProps = {
  exam: Exam
  filterValues: FilterValues
  assignmentFilterOptions: AssignmentFilterOptions
}

function ensureTarkentamattomatPaaoppimaarasAreIncluded(oppimaaras: Oppimaara[]): Oppimaara[] {
  const oppimaarasWithPaaoppimaaras = oppimaaras.slice()
  for (const o of oppimaaras) {
    if (
      o.kielitarjontaKoodiArvo !== null &&
      !oppimaarasWithPaaoppimaaras.find(
        (o2) => o2.oppimaaraKoodiArvo === o.oppimaaraKoodiArvo && o2.kielitarjontaKoodiArvo === null
      )
    ) {
      oppimaarasWithPaaoppimaaras.push({
        oppimaaraKoodiArvo: o.oppimaaraKoodiArvo,
        kielitarjontaKoodiArvo: null
      })
    }
  }
  return oppimaarasWithPaaoppimaaras
}

export const AssignmentFilters = ({
  exam,
  filterValues: { filterValues, setFilterValue, resetFilterValues },
  assignmentFilterOptions
}: AssignmentFiltersProps) => {
  const { t } = useTranslation()
  const { koodistos, getKoodiLabel, getOppimaaraLabel, sortKooditAlphabetically } = useKoodisto()

  const handleFilterChange = useCallback(
    (key: keyof FiltersType, value: SingleValue<LudosSelectOption>) => {
      const filterValue = value?.value || null
      setFilterValue(key, filterValue, true)
    },
    [setFilterValue]
  )

  const oppimaaraOptions = ensureTarkentamattomatPaaoppimaarasAreIncluded(assignmentFilterOptions.oppimaara ?? [])

  const tehtavatyyppiSukoOptions =
    assignmentFilterOptions.tehtavatyyppi && exam === Exam.SUKO
      ? koodisOrDefaultLabel(assignmentFilterOptions.tehtavatyyppi, koodistos.tehtavatyyppisuko)
      : []
  const tehtavatyyppiPuhviOptions =
    assignmentFilterOptions.tehtavatyyppi && exam === Exam.PUHVI
      ? koodisOrDefaultLabel(assignmentFilterOptions.tehtavatyyppi, koodistos.tehtavatyyppipuhvi)
      : []
  const aiheOptions = assignmentFilterOptions.aihe
    ? koodisOrDefaultLabel(assignmentFilterOptions.aihe, koodistos.aihesuko)
    : []
  const lukuvuosiOptions = assignmentFilterOptions.lukuvuosi
    ? koodisOrDefaultLabel(assignmentFilterOptions.lukuvuosi, koodistos.ludoslukuvuosi)
    : []
  const lukiodiplomiaineOptions = assignmentFilterOptions.aine
    ? koodisOrDefaultLabel(assignmentFilterOptions.aine, koodistos.ludoslukiodiplomiaine)
    : []

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
                value={currentOppimaaraSelectOption(
                  filterValues.oppimaara ? oppimaaraFromId(filterValues.oppimaara) : undefined,
                  getOppimaaraLabel
                )}
                onChange={(opt) => handleFilterChange('oppimaara', opt)}
                isSearchable
                isClearable
              />
            </div>
            <div className="w-full px-2 md:w-6/12 lg:w-3/12">
              <p>{t('filter.tyyppi')}</p>
              <LudosSelect
                name="contentTypeFilter"
                menuSize="md"
                options={koodistoSelectOptions(sortKooditAlphabetically(tehtavatyyppiSukoOptions))}
                value={currentKoodistoSelectOption(filterValues.tehtavatyyppisuko, koodistos['tehtavatyyppisuko'])}
                onChange={(opt) => handleFilterChange('tehtavatyyppisuko', opt)}
                isSearchable
                isClearable
              />
            </div>
            <div className="w-full px-2 lg:w-3/12">
              <p>{t('filter.aihe')}</p>
              <LudosSelect
                name="aiheFilter"
                menuSize="md"
                options={koodistoSelectOptions(sortKooditAlphabetically(aiheOptions))}
                value={currentKoodistoSelectOption(filterValues.aihe, koodistos['aihesuko'])}
                onChange={(opt) => handleFilterChange('aihe', opt)}
                isSearchable
                isClearable
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
              options={koodistoSelectOptions(sortKooditAlphabetically(lukuvuosiOptions))}
              value={currentKoodistoSelectOption(filterValues.lukuvuosi, koodistos['ludoslukuvuosi'])}
              onChange={(opt) => handleFilterChange('lukuvuosi', opt)}
              isSearchable
              isClearable
            />
          </div>
        )}
        {exam === Exam.LD && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.aine')}</p>
            <LudosSelect
              name="aineFilter"
              options={koodistoSelectOptions(sortKooditAlphabetically(lukiodiplomiaineOptions))}
              value={currentKoodistoSelectOption(filterValues.aine, koodistos['ludoslukiodiplomiaine'])}
              onChange={(opt) => handleFilterChange('aine', opt)}
              isSearchable
              isClearable
            />
          </div>
        )}
        {exam === Exam.PUHVI && (
          <div className="w-full px-2 md:w-3/12">
            <p>{t('filter.tehtavatyyppi')}</p>
            <LudosSelect
              name="tehtavatyyppiPuhviFilter"
              options={koodistoSelectOptions(sortKooditAlphabetically(tehtavatyyppiPuhviOptions))}
              value={currentKoodistoSelectOption(filterValues.tehtavatyyppipuhvi, koodistos['tehtavatyyppipuhvi'])}
              onChange={(opt) => handleFilterChange('tehtavatyyppipuhvi', opt)}
              isSearchable
              isClearable
            />
          </div>
        )}
        <div className="flex items-end w-full md:w-3/12">
          <Button variant="buttonGhost" onClick={resetFilterValues}>
            <span className="text-green-primary text-xs">{t('filter.tyhjenna-valinnat')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
