import { useLocation, useMatch } from 'react-router-dom'
import { Exam } from '../../../../types'
import { SukoAssignmentForm } from './SukoAssignmentForm'
import { PuhviAssignmentForm } from './PuhviAssignmentForm'
import { LdAssignmentForm } from './LdAssignmentForm'

type AssignmentFormProps = {
  action: 'new' | 'update'
}

const AssignmentForm = ({ action }: AssignmentFormProps) => {
  const { pathname } = useLocation()

  const matchUrl = action === 'new' ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const exam = match!.params.exam!.toUpperCase() as Exam

  const formProps = { action, id: action === 'update' ? match!.params.id : undefined }

  return (
    <div className="ludos-form">
      {exam.toUpperCase() === Exam.Suko ? (
        <SukoAssignmentForm {...formProps} />
      ) : exam === Exam.Puhvi ? (
        <PuhviAssignmentForm {...formProps} />
      ) : (
        <LdAssignmentForm {...formProps} />
      )}
    </div>
  )
}

export default AssignmentForm
