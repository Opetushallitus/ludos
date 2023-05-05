import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import { AssignmentIn, Exam, ExamTypesEng } from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { useTranslation } from 'react-i18next'
import React from 'react'
import { SukoAssignmentContent } from './SukoAssignmentContent'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../exam/assignment/assignmentUtils'
import { PuhviAssignmentContent } from './PuhviAssignmentContent'
import { LdAssignmentContent } from './LdAssignmentContent'

type AssignmentProps = { exam: Exam }

export const Assignment = ({ exam }: AssignmentProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { examType, id } = useParams<{ examType: string; id: string }>()

  const url =
    examType === ExamTypesEng.KOETEHTAVAT
      ? `assignment/`
      : examType === ExamTypesEng.OHJEET
      ? `instruction/`
      : `certificate/`

  const { data: assignment, loading, error } = useFetch<AssignmentIn>(`${url}/${exam}/${id}`)

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>error</div>
  }

  return (
    <div className="min-h-[80vh]">
      {assignment && (
        <>
          <div className="row mt-5">
            <p>{new Date(assignment.createdAt).toLocaleDateString('fi-FI')}</p>
          </div>
          <div className="row">
            <div className="col w-9/12 pr-5">
              <div className="row pb-3">
                {isSukoAssignment(assignment, exam) && (
                  <SukoAssignmentContent assignment={assignment} examType={examType} />
                )}
                {isPuhviAssignment(assignment, exam) && (
                  <PuhviAssignmentContent assignment={assignment} examType={examType} />
                )}
                {isLdAssignment(assignment, exam) && (
                  <LdAssignmentContent assignment={assignment} examType={examType} />
                )}
              </div>
              <div className="row mb-6">
                <Button variant="buttonSecondary" onClick={() => navigate(`/${exam}/${examType}`)} data-testid="return">
                  {t('assignment.palaa')}
                </Button>
              </div>
            </div>
            <div className="col w-3/12 border-l border-gray-separator"></div>
          </div>
        </>
      )}
    </div>
  )
}
