import { useEffect, useState } from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, Exam, ContentTypesEng } from '../../../types'
import { AssignmentCard } from './AssignmentCard'
import { FiltersType, useFilters } from '../../../hooks/useFilters'
import { ContentTypeTranslationEnglish, removeEmpty } from './assignmentUtils'
import { InstructionCard } from '../instruction/InstructionCard'
import { AssignmentFilters } from './AssignmentFilters'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'
import { EXAM_TYPE_ENUM } from '../../../constants'

export const AssignmentList = ({
  exam,
  contentType,
  activeTab
}: {
  exam: Exam
  contentType: string
  activeTab: string
}) => {
  const { filters, setFilters } = useFilters()
  const [language, setLanguage] = useState<string>('fi')

  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  const urlByContentType = () => {
    if (contentType === ContentTypesEng.KOETEHTAVAT) {
      return `${EXAM_TYPE_ENUM.ASSIGNMENT}/${exam!.toLocaleUpperCase()}?${new URLSearchParams(
        removeNullsFromFilterObj
      ).toString()}`
    }

    if (contentType === ContentTypesEng.OHJEET) {
      return `${EXAM_TYPE_ENUM.INSTRUCTION}/${exam!.toLocaleUpperCase()}`
    }

    return `${EXAM_TYPE_ENUM.CERTIFICATE}/${exam!.toLocaleUpperCase()}`
  }

  const { data, loading, error, refresh } = useFetch<AssignmentIn[]>(urlByContentType())

  // refresh data on tab change
  useEffect(() => {
    const singularContentType = ContentTypeTranslationEnglish[activeTab]

    if (contentType !== singularContentType) {
      refresh()
    }
  }, [activeTab, contentType, refresh])

  return (
    <div>
      {loading ? (
        <div className="mt-10 text-center">
          <Spinner />
        </div>
      ) : (
        <>
          {error && <div className="mt-10 text-center">Virhe ladattaessa koetehtäviä</div>}
          {data && (
            <>
              {contentType === ContentTypesEng.KOETEHTAVAT && (
                <div>
                  <AssignmentFilters
                    filters={filters}
                    setFilters={setFilters}
                    language={language}
                    setLanguage={setLanguage}
                  />
                  <ul>
                    {data?.map((assignment, i) => (
                      <AssignmentCard language={language} assignment={assignment} exam={exam} key={i} />
                    ))}
                  </ul>
                </div>
              )}
              {contentType === ContentTypesEng.OHJEET && (
                <div className="mt-3 flex flex-wrap gap-5">
                  <>{loading && <Spinner />}</>
                  {data?.map((assignment, i) => (
                    <InstructionCard assignment={assignment} exam={exam} key={i} />
                  ))}
                </div>
              )}
              {contentType === ContentTypesEng.TODISTUKSET && (
                <div className="mt-3 flex flex-wrap gap-5">
                  <>{loading && <Spinner />}</>
                  {data?.map((assignment, i) => (
                    <CertificateCard assignment={assignment} key={i} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
