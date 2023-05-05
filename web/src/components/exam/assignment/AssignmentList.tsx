import React, { useCallback, useEffect, useState } from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, Exam, ExamTypesEng } from '../../../types'
import { AssignmentCard } from './AssignmentCard'
import { FiltersType, useFilters } from '../../../hooks/useFilters'
import { AssignmentKeyTranslationEnglish, removeEmpty } from './assignmentUtils'
import { InstructionCard } from '../instruction/InstructionCard'
import { AssignmentFilters } from './AssignmentFilters'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'

export const AssignmentList = ({ exam, examType, activeTab }: { exam: Exam; examType: string; activeTab: string }) => {
  const { filters, setFilters } = useFilters()
  const [language, setLanguage] = useState<string>('fi')

  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)

  const url =
    examType === ExamTypesEng.KOETEHTAVAT
      ? `assignment/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}&${new URLSearchParams(
          removeNullsFromFilterObj
        ).toString()}`
      : examType === ExamTypesEng.OHJEET
      ? `instruction/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}`
      : `certificate/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}`

  const { data, loading, refresh } = useFetch<AssignmentIn[]>(url)

  // refresh data on tab change
  useEffect(() => {
    const singularExamType = AssignmentKeyTranslationEnglish[activeTab]

    if (examType !== singularExamType) {
      refresh()
    }
  }, [activeTab, examType, refresh])

  return (
    <div>
      {!data ? (
        <div className="mt-10 text-center">
          <Spinner />
        </div>
      ) : (
        <>
          {examType === ExamTypesEng.KOETEHTAVAT && (
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
          {examType === ExamTypesEng.OHJEET && (
            <div className="mt-3 flex flex-wrap gap-5">
              <>{loading && <Spinner />}</>
              {data?.map((assignment, i) => (
                <InstructionCard assignment={assignment} exam={exam} key={i} />
              ))}
            </div>
          )}
          {examType === ExamTypesEng.TODISTUKSET && (
            <div className="mt-3 flex flex-wrap gap-5">
              <>{loading && <Spinner />}</>
              {data?.map((assignment, i) => (
                <CertificateCard assignment={assignment} exam={exam} key={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
