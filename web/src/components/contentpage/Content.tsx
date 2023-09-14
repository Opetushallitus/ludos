import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import { BaseIn, ContentTypeEng, Exam } from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { useTranslation } from 'react-i18next'
import { isAssignment, isCertificate, isInstruction } from '../exam/assignment/assignmentUtils'
import { EXAM_TYPE_ENUM } from '../../constants'
import { Spinner } from '../Spinner'
import { ContentHeader } from './ContentCommon'
import { useState } from 'react'
import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { AssignmentContent } from './AssignmentContent'
import { CertificateContent } from './CertificateContent'
import { InstructionContent } from './InstructionsContent'
import { useUserDetails } from '../../hooks/useUserDetails'
import { muokkausKey } from '../routes/routes'

type ContentProps = {
  exam: Exam
  isPresentation: boolean
}

const Content = ({ exam, isPresentation }: ContentProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { contentType, id } = useParams<{ contentType: string; id: string }>()
  const location = useLocation()
  const { isYllapitaja } = useUserDetails()

  const [language, setLanguage] = useState<string>('fi')

  const contentTypeSingular =
    contentType === ContentTypeEng.KOETEHTAVAT
      ? EXAM_TYPE_ENUM.ASSIGNMENT
      : contentType === ContentTypeEng.OHJEET
      ? EXAM_TYPE_ENUM.INSTRUCTION
      : EXAM_TYPE_ENUM.CERTIFICATE

  const { data, loading } = useFetch<BaseIn>(`${contentTypeSingular}/${exam}/${id}`)

  const handleNavigation = () => {
    const pathName = `/${exam.toLowerCase()}/${contentType}`
    const backNavigationSearchString = new URLSearchParams(location.state?.searchValuesString)
    const navigateToString = `${pathName}?${backNavigationSearchString.toString()}`

    navigate(navigateToString, { replace: true })
  }

  return (
    <div className="min-h-[80vh]">
      {!data && loading && <Spinner className="mt-32 text-center" />}
      {data && (
        <>
          <div className="row">
            <div className="col w-full pr-5 md:w-9/12">
              <div className="row pb-3">
                <div className="col min-h-[40vh] w-full">
                  <ContentHeader
                    language={language}
                    data={data}
                    onSelectedOptionsChange={(opt: string) => setLanguage(opt)}
                    contentType={contentType!} // fixme: could this ever be undefined?
                    isPresentation={isPresentation}
                  />
                  {!isPresentation && isYllapitaja && (
                    <div className="row">
                      <StateTag state={data.publishState} />
                      <span
                        className="row ml-3 gap-1 hover:cursor-pointer hover:underline"
                        onClick={() => navigate(`../${contentType}/${muokkausKey}/${data.id}`)}
                        data-testid="edit-content-btn">
                        <Icon name="muokkaa" color="text-green-primary" />
                        <p className="text-green-primary">{t('assignment.muokkaa')}</p>
                      </span>
                    </div>
                  )}
                  {contentType && isAssignment(data, contentType) && (
                    <AssignmentContent
                      assignment={data}
                      exam={exam}
                      language={language}
                      isPresentation={isPresentation}
                    />
                  )}

                  {contentType && isCertificate(data, contentType) && <CertificateContent certificate={data} />}

                  {contentType && isInstruction(data, contentType) && (
                    <InstructionContent instruction={data} language={language} isPresentation={isPresentation} />
                  )}
                </div>
              </div>
              {!isPresentation && (
                <div className="row mb-6">
                  <Button variant="buttonSecondary" onClick={handleNavigation} data-testid="return">
                    {t(`${contentTypeSingular}.palaa`)}
                  </Button>
                </div>
              )}
            </div>
            {!isPresentation && <div className="hidden w-3/12 flex-col border-l border-gray-separator md:flex" />}
          </div>
        </>
      )}
    </div>
  )
}

export default Content
