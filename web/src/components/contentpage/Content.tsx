import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import { AssignmentIn, Exam, ContentTypeEng } from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { useTranslation } from 'react-i18next'
import { SukoContent } from './SukoContent'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../exam/assignment/assignmentUtils'
import { PuhviContent } from './PuhviContent'
import { LdContent } from './LdContent'
import { EXAM_TYPE_ENUM } from '../../constants'
import { Spinner } from '../Spinner'

type AssignmentProps = { exam: Exam }

export const Content = ({ exam }: AssignmentProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentType, id } = useParams<{ contentType: string; id: string }>()
  const location = useLocation()

  const contentTypeSingular =
    contentType === ContentTypeEng.KOETEHTAVAT
      ? EXAM_TYPE_ENUM.ASSIGNMENT
      : contentType === ContentTypeEng.OHJEET
      ? EXAM_TYPE_ENUM.INSTRUCTION
      : EXAM_TYPE_ENUM.CERTIFICATE

  const { data: assignment, loading } = useFetch<AssignmentIn>(`${contentTypeSingular}/${exam}/${id}`)

  const handleNavigation = () => {
    const pathName = `/${exam.toLowerCase()}/${contentType}`
    const backNavigationSearchString = new URLSearchParams(location.state?.searchValuesString)
    const navigateToString = `${pathName}?${backNavigationSearchString.toString()}`

    navigate(navigateToString, { replace: true })
  }

  return (
    <div className="min-h-[80vh]">
      {!assignment && loading && (
        <div className="mt-32 text-center">
          <Spinner />
        </div>
      )}
      {assignment && (
        <>
          <div className="row mt-5">
            <p>{new Date(assignment.createdAt).toLocaleDateString('fi-FI')}</p>
          </div>
          <div className="row">
            <div className="col w-full pr-5 md:w-9/12">
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
                <Button variant="buttonSecondary" onClick={handleNavigation} data-testid="return">
                  {t(`${contentTypeSingular}.palaa`)}
                </Button>
              </div>
            </div>
            <div className="hidden w-3/12 flex-col border-l border-gray-separator md:flex" />
          </div>
        </>
      )}
    </div>
  )
}
