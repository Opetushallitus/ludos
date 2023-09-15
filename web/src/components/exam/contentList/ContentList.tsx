import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, BaseIn, ContentType, ContentTypeSingularEng, Exam, InstructionIn } from '../../../types'
import { FiltersType } from '../../../hooks/useFilterValues'
import { InstructionCard } from '../instruction/InstructionCard'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'
import { isAssignmentsArr, isCertificatesArr, isInstructionsArr, removeEmpty } from '../assignment/assignmentUtils'
import { AssignmentCard } from '../assignment/AssignmentCard'

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

interface ContentListProps {
  exam: Exam
  contentType: ContentType
  language: string
  filterValues: FiltersType
}

export const ContentList = ({ exam, contentType, language, filterValues }: ContentListProps) => {
  const { data, loading, error } = useFetch<BaseIn[]>(urlByContentType(exam, contentType, filterValues))
  const filterByLanguage = (data: AssignmentIn | InstructionIn) => {
    if (language === 'fi') {
      return data.nameFi !== ''
    } else if (language === 'sv') {
      return data.nameSv !== ''
    }
    return true
  }

  return (
    <div>
      {loading && <Spinner className="mt-10 text-center" />}
      {error && <div className="mt-10 text-center text-red-primary">Virhe ladattaessa koetehtäviä</div>}
      {data && (
        <>
          {isAssignmentsArr(data, contentType) && (
            <ul data-testid="assignment-list">
              {data.filter(filterByLanguage).map((assignment, i) => (
                <AssignmentCard
                  language={language}
                  assignment={assignment}
                  exam={exam}
                  key={`${exam}-${contentType}-${i}`}
                />
              ))}
            </ul>
          )}
          {isInstructionsArr(data, contentType) && (
            <ul className="mt-3 flex flex-wrap gap-5">
              {data.filter(filterByLanguage).map((instruction, i) => (
                <InstructionCard
                  language={language}
                  instruction={instruction}
                  exam={exam}
                  key={`${exam}-${contentType}-${i}`}
                />
              ))}
            </ul>
          )}
          {isCertificatesArr(data, contentType) && (
            <ul className="mt-3 flex flex-wrap gap-5">
              {data.map((certificate, i) => (
                <CertificateCard certificate={certificate} key={`${exam}-${contentType}-${i}`} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
