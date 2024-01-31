import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentOut,
  AssignmentsOut,
  ContentType,
  ContentTypeSingular,
  ContentTypeSingularEng,
  emptyAssignmentFilterOptions,
  Exam,
  TeachingLanguage
} from '../../../../types'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { AssignmentCard } from './AssignmentCard'
import { Pagination } from '../../../Pagination'
import { TeachingLanguageSelect } from '../../../TeachingLanguageSelect'
import { InternalLink } from '../../../InternalLink'
import { buttonClasses } from '../../../Button'
import { uusiKey } from '../../../LudosRoutes'
import { preventLineBreaksFromSpace } from '../../../../utils/formatUtils'
import { ContentOrderFilter } from '../ContentOrderFilter'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { AssignmentFilters } from './AssignmentFilters'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useContext } from 'react'
import { LudosContext } from '../../../../contexts/LudosContext'
import { Spinner } from '../../../Spinner'
import { InfoBox } from '../../../InfoBox'

const filterByTeachingLanguage = (data: AssignmentOut, teachingLanguage: TeachingLanguage) => {
  if (teachingLanguage === TeachingLanguage.fi) {
    return data.nameFi !== ''
  } else if (teachingLanguage === TeachingLanguage.sv) {
    return data.nameSv !== ''
  }
  return true
}

type AssignmentListProps = {
  exam: Exam
  filterValues: FilterValues
  isFavoritePage?: boolean
}

export const AssignmentList = ({ exam, filterValues, isFavoritePage }: AssignmentListProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)
  const singularActiveTab = ContentTypeSingular[ContentType.koetehtavat]

  const contentType = ContentType.koetehtavat
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues.filterValues)

  const { data, loading, error, refresh } = useFetch<AssignmentsOut>(
    `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO
  const languageOverrideIfSukoAssignment = exam === Exam.SUKO ? 'fi' : teachingLanguage

  if (error) {
    return <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />
  }

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <Spinner />
      </div>
    )
  }

  if (isFavoritePage && !data?.content.length) {
    return <InfoBox type="info" i18nKey={lt.favoritePageNoContentMessage[exam]} />
  }

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && !isFavoritePage && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${singularActiveTab}-button`}>
              {preventLineBreaksFromSpace(t('button.lisaakoetehtava'))}
            </InternalLink>
          )}
        </div>
        <div className="row gap-6">
          {shouldShowTeachingLanguageDropdown && (
            <div className="flex flex-col gap-2 md:flex-row">
              <p className="mt-2">{t('filter.koetehtavat-kieli')}</p>
              <TeachingLanguageSelect />
            </div>
          )}
          <ContentOrderFilter
            contentOrder={filterValues.filterValues.jarjesta}
            setContentOrder={(contentOrder) => filterValues.setFilterValue('jarjesta', contentOrder, true)}
          />
        </div>
      </div>

      <AssignmentFilters
        exam={exam}
        filterValues={filterValues}
        assignmentFilterOptions={data?.assignmentFilterOptions ?? emptyAssignmentFilterOptions}
      />

      {data && (
        <>
          <ul data-testid="card-list">
            {data.content
              .filter((val) => filterByTeachingLanguage(val, languageOverrideIfSukoAssignment))
              .map((assignment, i) => (
                <AssignmentCard
                  teachingLanguage={languageOverrideIfSukoAssignment}
                  assignment={assignment}
                  exam={exam}
                  key={`${exam}-${contentType}-${i}`}
                  isFavoritePage={isFavoritePage}
                  refreshData={refresh}
                />
              ))}
          </ul>

          <Pagination
            page={filterValues.filterValues.sivu}
            totalPages={data.totalPages!}
            searchStringForNewFilterValue={filterValues.searchStringForNewFilterValue}
          />
        </>
      )}
    </div>
  )
}
