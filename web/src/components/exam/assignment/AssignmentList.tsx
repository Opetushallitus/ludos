import React from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentIn, Exam, ExamTypesEng } from '../../../types'
import { AssignmentCard } from './AssignmentCard'
import { FiltersType, useFilters } from '../../../hooks/useFilters'
import { removeEmpty } from './assignmentUtils'
import { InstructionCard } from '../instruction/InstructionCard'
import { AssignmentFilters } from './AssignmentFilters'
import { Spinner } from '../../Spinner'
import { CertificateCard } from '../certificate/CertificateCard'

export const AssignmentList = ({ exam, examType }: { exam: Exam; examType: string }) => {
  const { filters, setFilters } = useFilters()

  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)
  const url = `assignment/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}`
  const { data, loading, error } = useFetch<AssignmentIn[]>(
    `${url}&${new URLSearchParams(removeNullsFromFilterObj).toString()}`
  )

  return (
    <div>
      {loading ? (
        <div className="mt-10 text-center">
          <Spinner />
        </div>
      ) : (
        <>
          {examType === ExamTypesEng.KOETEHTAVAT && (
            <div>
              <AssignmentFilters filters={filters} setFilters={setFilters} />
              <ul>
                {data?.map((assignment, i) => (
                  <AssignmentCard assignment={assignment} exam={exam} key={i} />
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
