import { useLocation, useMatch } from 'react-router-dom'
import { ContentTypeEng, Exam } from '../../../../types'
import { FormHeader } from '../../formCommon/FormHeader'
import { SukoAssignmentForm } from './SukoAssignmentForm'
import { PuhviAssignmentForm } from './PuhviAssignmentForm'
import { LdAssignmentForm } from './LdAssignmentForm'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

export const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { pathname, state } = useLocation()
  const match = useMatch(`/:exam/:contentType/${action}`)
  const assignment = state?.assignment

  const exam = match!.params.exam!.toUpperCase() as Exam

  const formProps = { action, assignment, pathname, exam }

  return (
    <div className="w-10/12 pt-3">
      <FormHeader action={action} contentType={ContentTypeEng.KOETEHTAVAT} name={assignment?.nameFi} />
      {exam === Exam.Suko ? (
        <SukoAssignmentForm {...formProps} />
      ) : exam === Exam.Puhvi ? (
        <PuhviAssignmentForm {...formProps} />
      ) : (
        <LdAssignmentForm {...formProps} />
      )}
    </div>
  )
}
