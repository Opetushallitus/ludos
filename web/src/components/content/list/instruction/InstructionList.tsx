import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentOut,
  ContentOut,
  ContentType,
  ContentTypeSingular,
  ContentTypeSingularEng,
  Exam,
  InstructionDtoOut,
  TeachingLanguage
} from '../../../../types'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { InstructionCard } from './InstructionCard'
import { Spinner } from '../../../Spinner'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { TeachingLanguageSelect, TeachingLanguageSelectProps } from '../../../TeachingLanguageSelect'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaks } from '../../../../utils/formatUtils'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { Icon } from '../../../Icon'

const filterByTeachingLanguage = (data: AssignmentOut | InstructionDtoOut, teachingLanguage: TeachingLanguage) => {
  if (teachingLanguage === TeachingLanguage.fi) {
    return data.nameFi !== ''
  } else if (teachingLanguage === TeachingLanguage.sv) {
    return data.nameSv !== ''
  }
  return true
}

type InstructionListProps = {
  exam: Exam
  teachingLanguageSelectProps: TeachingLanguageSelectProps
  filterValues: FilterValues
}

export const InstructionList = ({ exam, teachingLanguageSelectProps, filterValues }: InstructionListProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()

  const singularActiveTab = ContentTypeSingular[ContentType.ohjeet]

  const contentType = ContentType.ohjeet
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues.filterValues)

  const { data, loading, error } = useFetch<ContentOut<InstructionDtoOut>>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const teachingLanguage = teachingLanguageSelectProps.teachingLanguage

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaks(t('button.lisaaohje'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          <div className="flex flex-col gap-2 md:flex-row">
            <p className="mt-2">{t('filter.ohjeet-kieli')}</p>
            <TeachingLanguageSelect {...teachingLanguageSelectProps} />
          </div>

          <ContentOrderFilter
            contentOrder={filterValues.filterValues.jarjesta}
            setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      {loading && <Spinner className="mt-10 text-center" />}

      {error && (
        <div className="flex justify-center w-full gap-2 text-red-primary">
          <Icon name="virheellinen" color="text-red-primary" />
          {lt.contentListErrorMessage[contentType]}
        </div>
      )}

      {data && (
        <ul className="mt-3 flex flex-wrap gap-5">
          {data.content
            .filter((val) => filterByTeachingLanguage(val, teachingLanguage))
            .map((instruction, i) => (
              <InstructionCard
                teachingLanguage={teachingLanguage}
                instruction={instruction}
                exam={exam}
                key={`${exam}-${contentType}-${i}`}
              />
            ))}
        </ul>
      )}
    </div>
  )
}
