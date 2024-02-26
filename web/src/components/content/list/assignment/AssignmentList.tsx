import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentCardOut,
  AssignmentsOut,
  ContentType,
  ContentTypeSingularFi,
  ContentTypeSingularEn,
  emptyAssignmentFilterOptions,
  Exam,
  FavoriteIdsDtoOut,
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
import { InfoBox } from '../../../InfoBox'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'

export const filterByTeachingLanguage = (data: AssignmentCardOut, teachingLanguage: TeachingLanguage) => {
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
}

export const AssignmentList = ({ exam, filterValues }: AssignmentListProps) => {
  const { isYllapitaja } = useUserDetails()
  const { t, lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const contentType = ContentType.ASSIGNMENT
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues.filterValues)

  const { data, loading, error } = useFetch<AssignmentsOut>(
    `${ContentTypeSingularEn[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const {
    data: favoriteIds,
    error: favoriteIdsError,
    refresh: favoriteIdsRefresh
  } = useFetch<FavoriteIdsDtoOut>(`${ContentTypeSingularEn.ASSIGNMENT}/favorites/${exam.toLocaleUpperCase()}`)

  const shouldShowTeachingLanguageDropdown = exam !== Exam.SUKO
  const languageOverrideIfSukoAssignment = exam === Exam.SUKO ? 'fi' : teachingLanguage

  const hasError = error || favoriteIdsError

  if (hasError) {
    return <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />
  }

  if (loading) {
    return <PageLoadingIndicator />
  }

  return (
    <div>
      <div className="row my-5 flex-wrap justify-between">
        <div className="w-full md:w-[20%]">
          {isYllapitaja && (
            <InternalLink
              className={buttonClasses('buttonPrimary')}
              to={`${location.pathname}/${uusiKey}`}
              data-testid={`create-${ContentTypeSingularFi.ASSIGNMENT}-button`}>
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
        teachingLanguage={languageOverrideIfSukoAssignment}
      />

      {data && (
        <>
          <ul data-testid="card-list">
            {data.content
              .filter((val) => filterByTeachingLanguage(val, languageOverrideIfSukoAssignment))
              .map((assignment, i) => (
                <AssignmentCard
                  teachingLanguage={languageOverrideIfSukoAssignment}
                  assignmentCard={assignment}
                  favoriteIds={favoriteIds}
                  key={`${exam}-${contentType}-${i}`}
                  favoriteIdsRefresh={favoriteIdsRefresh}
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
