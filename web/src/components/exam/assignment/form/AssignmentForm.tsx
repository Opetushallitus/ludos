import { useLocation, useMatch } from 'react-router-dom'
import { ContentType, Exam, SukoAssignmentIn } from '../../../../types'
import { FormHeader } from '../../../formCommon/FormHeader'
import { SukoAssignmentForm } from './SukoAssignmentForm'
import { PuhviAndLdAssignmentForm } from './PuhviAndLdAssignmentForm'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const assignment = (state?.assignment as SukoAssignmentIn) || null

  const contentType = match!.params.contentType as ContentType
  const exam = match!.params.exam!.toUpperCase() as Exam

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={contentType} assignment={assignment} />
      {exam === Exam.Suko ? (
        <SukoAssignmentForm action={action} assignment={assignment} contentType={contentType} pathname={pathname} />
      ) : (
        <PuhviAndLdAssignmentForm
          action={action}
          assignment={assignment}
          contentType={contentType}
          pathname={pathname}
          exam={exam}
        />
      )}
    </div>
  )
}
