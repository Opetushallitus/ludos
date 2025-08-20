import { useMatch } from 'react-router-dom'
import { ContentFormAction, Exam } from '../../../types'
import { LdAssignmentForm } from './LdAssignmentForm'
import { PuhviAssignmentForm } from './PuhviAssignmentForm'
import { SukoAssignmentForm } from './SukoAssignmentForm'

type AssignmentFormProps = {
  action: ContentFormAction
}

function parseExam(string: string): Exam | undefined {
  return Object.values(Exam).find((e) => e === string)
}

const AssignmentFormPage = ({ action }: AssignmentFormProps) => {
  const matchUrl =
    action === ContentFormAction.uusi ? `/:exam/:contentType/${action}` : `/:exam/:contentType/${action}/:id`
  const match = useMatch(matchUrl)
  const maybeExam = match?.params.exam?.toUpperCase()
  const exam = parseExam(maybeExam || '')
  if (!exam) {
    return
  }
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
