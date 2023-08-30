import { useEffect, useState } from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, BaseIn, ContentType, ContentTypeEng, Exam, InstructionIn } from '../../../types'
import { FiltersType, useFilters } from '../../../hooks/useFilters'
import { InstructionCard } from '../instruction/InstructionCard'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'
import { EXAM_TYPE_ENUM } from '../../../constants'
import { useLocation } from 'react-router-dom'
import {
  ContentTypeTranslationEnglish,
  isAssignmentsArr,
  isCertificatesArr,
  isInstructionsArr,
  removeEmpty
} from '../assignment/assignmentUtils'
import { AssignmentCard } from '../assignment/AssignmentCard'
import { ContentHeader } from './ContentHeader'

interface ContentListProps {
  exam: Exam
  contentType: string
  activeTab: ContentType
}

export const ContentList = ({ exam, contentType, activeTab }: ContentListProps) => {
  const location = useLocation()
  const { filters, setFilters, resetFilters } = useFilters({ initialSearchFilters: location.search, contentType })
  const [language, setLanguage] = useState<string>('fi')

  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  const urlByContentType = () => {
    if (contentType === ContentTypeEng.KOETEHTAVAT) {
      return `${EXAM_TYPE_ENUM.ASSIGNMENT}/${exam!.toLocaleUpperCase()}?${new URLSearchParams(
        removeNullsFromFilterObj
      ).toString()}`
    }

    if (contentType === ContentTypeEng.OHJEET) {
      return `${EXAM_TYPE_ENUM.INSTRUCTION}/${exam!.toLocaleUpperCase()}?${new URLSearchParams(
        removeNullsFromFilterObj
      ).toString()}`
    }

    return `${EXAM_TYPE_ENUM.CERTIFICATE}/${exam!.toLocaleUpperCase()}`
  }

  const { data, loading, error, refresh } = useFetch<BaseIn[]>(urlByContentType())

  // refresh data on tab change
  useEffect(() => {
    const singularContentType = ContentTypeTranslationEnglish[activeTab]

    // if activeTab and content type are not the same, refresh data and reset filters
    if (contentType !== singularContentType) {
      refresh()
      resetFilters()
    }
  }, [activeTab, contentType, refresh, resetFilters])

  const handleFilterChange = (key: keyof FiltersType, value: string) =>
    setFilters((curr) => ({ ...curr, [key]: value }))

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
      <ContentHeader
        exam={exam}
        activeTab={activeTab}
        contentType={contentType}
        filters={filters}
        setFilters={setFilters}
        handleFilterChange={handleFilterChange}
        language={language}
        setLanguage={setLanguage}
      />
      {loading && <Spinner className="mt-10 text-center" />}
      {error && <div className="mt-10 text-center text-red-primary">Virhe ladattaessa koetehtäviä</div>}
      {data && (
        <>
          {isAssignmentsArr(data, contentType) && (
            <ul data-testid="assignment-list">
              {data.filter(filterByLanguage).map((assignment, i) => (
                <AssignmentCard language={language} assignment={assignment} exam={exam} key={i} />
              ))}
            </ul>
          )}
          {isInstructionsArr(data, contentType) && (
            <ul className="mt-3 flex flex-wrap gap-5">
              {data.filter(filterByLanguage).map((instruction, i) => (
                <InstructionCard language={language} instruction={instruction} exam={exam} key={i} />
              ))}
            </ul>
          )}
          {isCertificatesArr(data, contentType) && (
            <ul className="mt-3 flex flex-wrap gap-5">
              {data.map((certificate, i) => (
                <CertificateCard certificate={certificate} key={i} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
