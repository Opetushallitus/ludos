import { useFetch } from '../../../../hooks/useFetch'
import {
  AssignmentCardOut,
  AssignmentsOut,
  ContentType,
  ContentTypeSingularEn,
  emptyAssignmentFilterOptions,
  Exam,
  FavoriteIdsDtoOut,
  Language
} from '../../../../types'
import { FiltersType, FilterValues } from '../../../../hooks/useFilterValues'
import { removeEmpty } from '../../../../utils/assignmentUtils'
import { AssignmentCard } from './AssignmentCard'
import { Pagination } from '../../../Pagination'
import { AssignmentFilters } from './AssignmentFilters'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useContext } from 'react'
import { LudosContext } from '../../../../contexts/LudosContext'
import { InfoBox } from '../../../InfoBox'
import { PageLoadingIndicator } from '../../../PageLoadingIndicator'
import { AssignmentListHeader } from './AssignmentListHeader'

export const filterByTeachingLanguage = (data: AssignmentCardOut, teachingLanguage: Language) => {
  if (teachingLanguage === Language.FI) {
    return data.nameFi !== ''
  } else if (teachingLanguage === Language.SV) {
    return data.nameSv !== ''
  }
  return true
}

type AssignmentListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const AssignmentList = ({ exam, filterValues }: AssignmentListProps) => {
  const { lt } = useLudosTranslation()
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

  const languageOverrideIfSukoAssignment = exam === Exam.SUKO ? 'FI' : teachingLanguage

  const hasError = error || favoriteIdsError

  if (hasError) {
    return <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />
  }

  return (
    <div>
      <AssignmentListHeader exam={exam} filterValues={filterValues} />

      <AssignmentFilters
        exam={exam}
        filterValues={filterValues}
        assignmentFilterOptions={data?.assignmentFilterOptions ?? emptyAssignmentFilterOptions}
      />

      {loading && <PageLoadingIndicator />}

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
