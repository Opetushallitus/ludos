import { useFetch } from '../../../hooks/useFetch'
import {
  AssignmentOut,
  ContentOut,
  ContentType,
  ContentTypeSingularEng,
  Exam,
  InstructionDtoOut,
  TeachingLanguage
} from '../../../types'
import { FiltersType, ParamsValue } from '../../../hooks/useFilterValues'
import { InstructionCard } from './InstructionCard'
import { Spinner } from '../../Spinner'
import { CertificateCard } from './CertificateCard'
import { isAssignmentsArr, isCertificatesArr, isInstructionsArr, removeEmpty } from '../../../utils/assignmentUtils'
import { AssignmentCard } from './AssignmentCard'
import { Pagination } from '../../Pagination'
import { ContentListHeader } from './ContentListHeader'
import { TeachingLanguageSelectProps } from '../../TeachingLanguageSelect'

const filterByTeachingLanguage = (data: AssignmentOut | InstructionDtoOut, teachingLanguage: TeachingLanguage) => {
  if (teachingLanguage === TeachingLanguage.fi) {
    return data.nameFi !== ''
  } else if (teachingLanguage === TeachingLanguage.sv) {
    return data.nameSv !== ''
  }
  return true
}

const urlByContentType = (exam: Exam, contentType: ContentType, filters: FiltersType) => {
  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  if (contentType === ContentType.koetehtavat) {
    return `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  }

  if (contentType === ContentType.ohjeet) {
    return `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}?${new URLSearchParams(
      removeNullsFromFilterObj
    ).toString()}`
  }

  return `${ContentTypeSingularEng[contentType]}/${exam.toLocaleUpperCase()}`
}

type ContentListProps = {
  exam: Exam
  contentType: ContentType
  teachingLanguageSelectProps: TeachingLanguageSelectProps
  filterValues: {
    filterValues: FiltersType
    setFilterValue: (key: keyof FiltersType, value: ParamsValue, replace: boolean) => void
  }
  isFavorite: boolean
}

export const ContentList = ({
  exam,
  contentType,
  teachingLanguageSelectProps,
  filterValues,
  isFavorite
}: ContentListProps) => {
  const { data, loading, error } = useFetch<ContentOut>(urlByContentType(exam, contentType, filterValues.filterValues))
  const teachingLanguage = teachingLanguageSelectProps.teachingLanguage

  return (
    <div>
      {loading && <Spinner className="mt-10 text-center" />}
      {/*todo: toast with localisation key*/}
      {error && <div className="mt-10 text-center text-red-primary">Virhe ladattaessa koetehtäviä</div>}
      {data && (
        <>
          <ContentListHeader
            exam={exam}
            contentType={contentType}
            filterValues={filterValues}
            assignmentFilterOptions={data?.assignmentFilterOptions}
            teachingLanguageProps={teachingLanguageSelectProps}
            isFavorite={isFavorite}
          />
          {isAssignmentsArr(data.content, contentType) ? (
            <ul data-testid="assignment-list">
              {data.content
                .filter((val) => filterByTeachingLanguage(val, teachingLanguage))
                .map((assignment, i) => (
                  <AssignmentCard
                    teachingLanguage={teachingLanguage}
                    assignment={assignment}
                    exam={exam}
                    key={`${exam}-${contentType}-${i}`}
                  />
                ))}
            </ul>
          ) : isInstructionsArr(data.content, contentType) ? (
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
          ) : (
            isCertificatesArr(data.content, contentType) && (
              <ul className="mt-3 flex flex-wrap gap-5">
                {data.content.map((certificate, i) => (
                  <CertificateCard certificate={certificate} key={`${exam}-${contentType}-${i}`} />
                ))}
              </ul>
            )
          )}

          <Pagination
            page={filterValues.filterValues.sivu}
            totalPages={data?.totalPages}
            onPageChange={(page) => filterValues.setFilterValue('sivu', page, false)}>
            {data && data.content.length > 0 && data.totalPages}
          </Pagination>
        </>
      )}
    </div>
  )
}
