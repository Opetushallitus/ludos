import { useCallback } from 'react'
import {
  assertPuhviOrLdAssignment,
  isLdAssignment,
  isSukoAssignment
} from '../components/exam/assignment/assignmentUtils'
import { AssignmentIn, Exam, LdAssignmentIn, PuhviAssignmentIn, SukoAssignmentIn } from '../types'

function extractFromSuko(
  data: AssignmentIn[] | undefined,
  exam: Exam,
  typeChecker: (ass: AssignmentIn, exam: Exam) => boolean,
  key: 'aiheKoodiArvos' | 'oppimaaraKoodiArvo' | 'assignmentTypeKoodiArvo'
) {
  const sukoAssignments: SukoAssignmentIn[] = data?.filter((it): it is SukoAssignmentIn => typeChecker(it, exam)) || []

  return sukoAssignments.map((it) => it[key]).flat() || []
}

export function useAssignmentFilterOverrides(exam: Exam, data?: AssignmentIn[]) {
  const aiheOptionsOverride = useCallback(
    (): string[] => extractFromSuko(data, exam, isSukoAssignment, 'aiheKoodiArvos'),
    [exam, data]
  )

  const oppimaaraOptionsOverride = useCallback(
    () => extractFromSuko(data, exam, isSukoAssignment, 'oppimaaraKoodiArvo'),
    [exam, data]
  )

  const tehtavaTyyppiOptionsOverride = useCallback(
    (): string[] => extractFromSuko(data, exam, isSukoAssignment, 'assignmentTypeKoodiArvo'),
    [exam, data]
  )

  const lukuvuosiOverride = useCallback((): string[] => {
    const ldAndPuhviAssignments: (PuhviAssignmentIn | LdAssignmentIn)[] =
      data?.filter((it): it is PuhviAssignmentIn | LdAssignmentIn => assertPuhviOrLdAssignment(it, exam)) || []

    return ldAndPuhviAssignments.map((it) => it.lukuvuosiKoodiArvos).flat()
  }, [exam, data])

  const lukiodiplomiaineOptionsOverride = useCallback((): string[] => {
    const ldAssignments: LdAssignmentIn[] = data?.filter((it): it is LdAssignmentIn => isLdAssignment(it, exam)) || []

    return ldAssignments.map((it) => it.aineKoodiArvo).flat()
  }, [exam, data])

  return {
    aiheOptionsOverride,
    oppimaaraOptionsOverride,
    tehtavaTyyppiOptionsOverride,
    lukuvuosiOverride,
    lukiodiplomiaineOptionsOverride
  }
}
