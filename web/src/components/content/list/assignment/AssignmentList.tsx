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

type AssignmentListProps = {
  exam: Exam
  filterValues: FilterValues
}

export const AssignmentList = ({ exam, filterValues }: AssignmentListProps) => {
  const { lt } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const contentType = ContentType.ASSIGNMENT
  const removeNullsFromFilterObj = removeEmpty<FiltersType>(filterValues.filterValues)

  const { data, isError, isFetching } = useFetch<AssignmentsOut>(
    ['assignmentsOutFiltered'],
    `${ContentTypeSingularEn[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  )

  const {
    data: favoriteIds,
    isError: isFavoriteIdsError,
    refetch: refetchFavoriteIds
  } = useFetch<FavoriteIdsDtoOut>(
    ['favoriteIds'],
    `${ContentTypeSingularEn.ASSIGNMENT}/favorites/${exam.toLocaleUpperCase()}`
  )
  const hasError = isError || isFavoriteIdsError

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

      {isFetching && <PageLoadingIndicator />}

      {data && (
        <>
          <ul data-testid="card-list">
            {data.content.map((assignment, i) => (
              <AssignmentCard
                teachingLanguage={exam === Exam.SUKO ? 'FI' : teachingLanguage}
                assignmentCard={assignment}
                favoriteIds={favoriteIds}
                key={`${exam}-${contentType}-${i}`}
                refetchFavoriteIds={refetchFavoriteIds}
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
