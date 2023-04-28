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

export const AssignmentList = ({ exam, examType, filters }: { exam: Exam; examType: string; filters: FiltersType }) => {
  let removeNullsFromFilterObj = removeEmpty<FiltersType>(filters)
  const url = `assignment/${exam!.toLocaleUpperCase()}?examType=${examType.toUpperCase()}`
  const { data, loading, error } = useFetch<AssignmentIn[]>(
    `${url}&${new URLSearchParams(removeNullsFromFilterObj).toString()}`
  )

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {data && data.length > 0 && (
        <ul>
          {data.map((assignment, i) => (
            <AssignmentCard assignment={assignment} exam={exam} key={i} />
          ))}
        </ul>
      )}
    </>
  )
}

// Removes key-value pairs with null or undefined values from an object
// src https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
function removeEmpty<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null))
}
