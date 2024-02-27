import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentOut,
  ContentType,
  ContentTypeSingularEn,
  ContentTypeSingularFi,
  Exam,
  InstructionDtoOut,
  InstructionsOut,
  Language
} from '../../../../types'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { InstructionCard } from './InstructionCard'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { TeachingLanguageSelect } from '../../../TeachingLanguageSelect'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { LudosSelect, LudosSelectOption } from '../../../ludosSelect/LudosSelect'
import { currentKoodistoSelectOptions, koodistoSelectOptions } from '../../../ludosSelect/helpers'
import { koodisOrDefaultLabel, sortKooditAlphabetically, useKoodisto } from '../../../../hooks/useKoodisto'
import { useCallback, useContext } from 'react'
import { MultiValue } from 'react-select'
import { LudosContext } from '../../../../contexts/LudosContext'
import { InfoBox } from '../../../InfoBox'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'

const filterByTeachingLanguage = (data: AssignmentOut | InstructionDtoOut, teachingLanguage: Language) => {
  if (teachingLanguage === Language.FI) {
    return data.nameFi !== ''
  } else if (teachingLanguage === Language.SV) {
    return data.nameSv !== ''
  }
  return true
}

type InstructionListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const InstructionList = ({ exam, filterValues: { filterValues, setFilterValue } }: InstructionListProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)
  const { koodistos } = useKoodisto(teachingLanguage)

  const contentType = ContentType.INSTRUCTION
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues)

  const { data, loading, error } = useFetch<InstructionsOut>(
    `${ContentTypeSingularEn[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

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

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${ContentTypeSingularFi.INSTRUCTION}-button`}>
              {preventLineBreaksFromSpace(t('button.lisaaohje'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.ohjeet-kieli')}</p>
            <TeachingLanguageSelect />
          </div>

          <ContentOrderFilter
            contentOrder={filterValues.jarjesta}
            setContentOrder={(contentOrder) => setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>
      {exam === Exam.LD && (
        <div className="border border-gray-light bg-gray-bg">
          <p className="px-2 py-1">{t('filter.ohjeet.otsikko')}</p>
          <div className="w-full p-2 md:w-3/12">
            <p>{t('filter.aine')}</p>
            <LudosSelect
              name="aineFilter"
              options={koodistoSelectOptions(
                sortKooditAlphabetically(
                  koodisOrDefaultLabel(data?.instructionFilterOptions.aine || [], koodistos.ludoslukiodiplomiaine)
                )
              )}
              value={currentKoodistoSelectOptions(filterValues.aine, koodistos['ludoslukiodiplomiaine'])}
              onChange={(opt) => handleMultiselectFilterChange('aine', opt)}
              isMulti
              isSearchable
            />
          </div>
        </div>
      )}

      {error && <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />}

      {loading && <PageLoadingIndicator />}

      <ul className="mt-3 flex flex-wrap gap-5" data-testid="card-list">
        {data?.content
          .filter((val) => filterByTeachingLanguage(val, teachingLanguage))
          .map((instruction, i) => (
            <InstructionCard
              teachingLanguage={teachingLanguage}
              instruction={instruction}
              key={`${exam}-${contentType}-${i}`}
            />
          ))}
      </ul>
    </div>
  )
}
