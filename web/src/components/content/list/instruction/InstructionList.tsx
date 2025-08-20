import { useCallback, useContext } from 'react'
import { SingleValue } from 'react-select'
import { LudosContext } from '../../../../contexts/LudosContext'
import { useFetch } from '../../../../hooks/useFetch'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { koodisOrDefaultLabel, useKoodisto } from '../../../../hooks/useKoodisto'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useUserDetails } from '../../../../hooks/useUserDetails'
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
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { buttonClasses } from '../../../Button'
import { InfoBox } from '../../../InfoBox'
import { InternalLink } from '../../../InternalLink'
import { uusiKey } from '../../../LudosRoutes'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../../../ludosSelect/helpers'
import { LudosSelect, LudosSelectOption } from '../../../ludosSelect/LudosSelect'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'
import { TeachingLanguageSelectWithLabel } from '../../../TeachingLanguageSelect'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { InstructionCard } from './InstructionCard'

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
  const { koodistos, sortKooditAlphabetically } = useKoodisto(teachingLanguage)

  const contentType = ContentType.INSTRUCTION
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues)

  const { data, isFetching, error } = useFetch<InstructionsOut>(
    ['instructionList'],
    `${ContentTypeSingularEn[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const handleFilterChange = useCallback(
    (key: keyof FiltersType, value: SingleValue<LudosSelectOption>) => {
      const filterValue = value?.value || null
      setFilterValue(key, filterValue, true)
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
              data-testid={`create-${ContentTypeSingularFi.INSTRUCTION}-button`}
            >
              {preventLineBreaksFromSpace(t('button.lisaaohje'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          <TeachingLanguageSelectWithLabel exam={exam} text={t('filter.ohjeet-kieli')} displaySuko={true} />

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
              value={currentKoodistoSelectOption(filterValues.aine, koodistos['ludoslukiodiplomiaine'])}
              onChange={(opt) => handleFilterChange('aine', opt)}
              isSearchable
              isClearable
            />
          </div>
        </div>
      )}

      {error && <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />}

      {isFetching && <PageLoadingIndicator />}

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
