import { useCallback } from 'react'
import {
  assertPuhviOrLdAssignment,
  isLdAssignment,
  isSukoAssignment
} from '../components/exam/assignment/assignmentUtils'
import { AssignmentOut, Exam, LdAssignmentDtoOut, PuhviAssignmentDtoOut, SukoAssignmentDtoOut } from '../types'

function sukoAssignments(data: AssignmentOut[] | undefined, exam: Exam): SukoAssignmentDtoOut[] {
  return (data?.filter((it) => isSukoAssignment(it, exam)) as SukoAssignmentDtoOut[] | undefined) || []
}

export function useAssignmentFilterOverrides(exam: Exam, data?: AssignmentOut[]) {
  const aiheOptionsOverride = useCallback(
    () => sukoAssignments(data, exam).flatMap((a) => a.aiheKoodiArvos),
    [exam, data]
  )

  const oppimaaraOptionsOverride = useCallback(() => sukoAssignments(data, exam).map((a) => a.oppimaara), [exam, data])

  const tehtavaTyyppiOptionsOverride = useCallback(
    () => sukoAssignments(data, exam).map((a) => a.assignmentTypeKoodiArvo),
    [exam, data]
  )

  const lukuvuosiOverride = useCallback((): string[] => {
    const ldAndPuhviAssignments: (PuhviAssignmentDtoOut | LdAssignmentDtoOut)[] =
      data?.filter((it): it is PuhviAssignmentDtoOut | LdAssignmentDtoOut => assertPuhviOrLdAssignment(it, exam)) || []

    return ldAndPuhviAssignments.map((it) => it.lukuvuosiKoodiArvos).flat()
  }, [exam, data])

  const lukiodiplomiaineOptionsOverride = useCallback((): string[] => {
    const ldAssignments: LdAssignmentDtoOut[] =
      data?.filter((it): it is LdAssignmentDtoOut => isLdAssignment(it, exam)) || []

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
