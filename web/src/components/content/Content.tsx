import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import { BaseOut, ContentType, ContentTypeSingularEng, Exam, TeachingLanguage } from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { isAssignment } from '../../utils/assignmentUtils'
import { ContentHeader } from './ContentCommon'
import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { AssignmentContent } from './AssignmentContent'
import { CertificateContent } from './CertificateContent'
import { InstructionContent } from './InstructionsContent'
import { useUserDetails } from '../../hooks/useUserDetails'
import { contentListPath, editingFormPath } from '../LudosRoutes'
import { InternalLink } from '../InternalLink'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useCallback, useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { isInstruction } from '../../utils/instructionUtils'
import { ContentError } from './ContentError'
import { isCertificate } from '../../utils/certificateUtils'

type ContentProps = {
  exam: Exam
  isPresentation: boolean
}

const Content = ({ exam, isPresentation }: ContentProps) => {
  const { lt, t } = useLudosTranslation()
  const navigate = useNavigate()
  const { contentType, id } = useParams<{ contentType: ContentType; id: string }>()
  const { state } = useLocation()
  const { isYllapitaja } = useUserDetails()
  const { teachingLanguage, setTeachingLanguage } = useContext(LudosContext)

  const teachingLanguageOverrideIfSukoAssignment =
    exam === Exam.SUKO && contentType === ContentType.koetehtavat ? TeachingLanguage.fi : teachingLanguage

  const { data, error } = useFetch<BaseOut>(`${ContentTypeSingularEng[contentType!]}/${exam}/${id}`)

  const handleNavigation = useCallback(() => {
    if (state?.returnLocation) {
      navigate(state.returnLocation)
    } else {
      navigate(contentListPath(exam, contentType!))
    }
  }, [contentType, exam, navigate, state?.returnLocation])

  if (error) {
    return <ContentError contentType={contentType!} error={error} />
  }
  if (!data || !contentType) {
    return null
  }

  return (
    <div className="min-h-[80vh]">
      <div className="row">
        <div className="col w-full pr-5 md:w-9/12">
          <div className="row pb-3">
            <div className="col min-h-[40vh] w-full">
              <ContentHeader
                teachingLanguage={teachingLanguageOverrideIfSukoAssignment}
                setTeachingLanguage={setTeachingLanguage}
                data={data}
                contentType={contentType}
                isPresentation={isPresentation}
              />
              {!isPresentation && isYllapitaja && (
                <div className="row">
                  <StateTag state={data.publishState} />
                  <InternalLink
                    className="row ml-3 gap-1 hover:cursor-pointer hover:underline"
                    to={editingFormPath(exam, contentType, data.id)}
                    state={state}
                    data-testid="edit-content-btn">
                    <Icon name="muokkaa" color="text-green-primary" />
                    <p className="text-green-primary">{t('assignment.muokkaa')}</p>
                  </InternalLink>
                </div>
              )}

              <div className="mb-4 border-b border-gray-separator mt-2" />

              {contentType === ContentType.koetehtavat && isAssignment(data) && (
                <AssignmentContent
                  assignment={data}
                  exam={exam}
                  teachingLanguage={teachingLanguageOverrideIfSukoAssignment}
                  isPresentation={isPresentation}
                />
              )}

              {contentType === ContentType.todistukset && isCertificate(data) && (
                <CertificateContent certificate={data} teachingLanguage={teachingLanguage} />
              )}
              {contentType === ContentType.ohjeet && isInstruction(data, contentType) && (
                <InstructionContent
                  instruction={data}
                  teachingLanguage={teachingLanguage}
                  isPresentation={isPresentation}
                />
              )}
            </div>
          </div>
          {!isPresentation && (
            <div className="row mb-6">
              <Button variant="buttonSecondary" onClick={handleNavigation} data-testid="return">
                {lt.returnTextByContentType[contentType]}
              </Button>
            </div>
          )}
        </div>
        {!isPresentation && <div className="hidden w-3/12 flex-col border-l border-gray-separator md:flex" />}
      </div>
    </div>
  )
}

export default Content
