import { useMatch } from 'react-router-dom'
import { ContentFormAction, Exam } from '../../../types'
import { SukoAssignmentForm } from './SukoAssignmentForm'
import { PuhviAssignmentForm } from './PuhviAssignmentForm'
import { LdAssignmentForm } from './LdAssignmentForm'

type AssignmentFormProps = {
  action: ContentFormAction
}

const AssignmentFormPage = ({ action }: AssignmentFormProps) => {
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const exam = match!.params.exam!.toUpperCase() as Exam

  const formProps = { action, id: action === ContentFormAction.muokkaus ? match!.params.id : undefined }

  return (
    <div className="ludos-form">
      {exam.toUpperCase() === Exam.SUKO ? (
        <SukoAssignmentForm {...formProps} />
      ) : exam === Exam.PUHVI ? (
        <PuhviAssignmentForm {...formProps} />
      ) : (
        <LdAssignmentForm {...formProps} />
      )}
    </div>
  )
}

export default AssignmentFormPage
