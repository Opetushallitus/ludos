import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import { AssignmentIn, Exam, ContentTypesEng } from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { useTranslation } from 'react-i18next'
import { SukoContent } from './SukoContent'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../exam/assignment/assignmentUtils'
import { PuhviContent } from './PuhviContent'
import { LdContent } from './LdContent'
import { EXAM_TYPE_ENUM } from '../../constants'

type AssignmentProps = { exam: Exam }

export const Content = ({ exam }: AssignmentProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentType, id } = useParams<{ contentType: string; id: string }>()

  const contentTypeSingular =
    contentType === ContentTypesEng.KOETEHTAVAT
      ? EXAM_TYPE_ENUM.ASSIGNMENT
      : contentType === ContentTypesEng.OHJEET
      ? EXAM_TYPE_ENUM.INSTRUCTION
      : EXAM_TYPE_ENUM.CERTIFICATE

  const { data: assignment, loading, error } = useFetch<AssignmentIn>(`${contentTypeSingular}/${exam}/${id}`)

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
                  <SukoContent assignment={assignment} contentType={contentType} />
                )}
                {isPuhviAssignment(assignment, exam) && (
                  <PuhviContent assignment={assignment} contentType={contentType} />
                )}
                {isLdAssignment(assignment, exam) && <LdContent assignment={assignment} contentType={contentType} />}
              </div>
              <div className="row mb-6">
                <Button
                  variant="buttonSecondary"
                  onClick={() => navigate(`/${exam}/${contentType}`)}
                  data-testid="return">
                  {t(`${contentTypeSingular}.palaa`)}
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
