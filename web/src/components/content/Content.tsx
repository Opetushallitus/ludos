import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import {
  AttachmentData,
  ContentBaseOut,
  ContentType,
  ContentTypeByContentTypePluralFi,
  ContentTypePluralFi,
  ContentTypeSingularEn,
  Exam,
  Language,
  isAssignment,
  isCertificate,
  isInstruction
} from '../../types'
import { useFetch } from '../../hooks/useFetch'
import { ContentHeader } from './ContentCommon'
import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { AssignmentContent } from './AssignmentContent'
import { CertificateContent } from './CertificateContent'
import { InstructionContent } from './InstructionsContent'
import { useUserDetails } from '../../hooks/useUserDetails'
import { contentListPath, contentPagePath, editingFormPath } from '../LudosRoutes'
import { InternalLink } from '../InternalLink'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useCallback, useContext, useState } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { ContentError } from './ContentError'
import { VersionHistoryViewerModal } from '../modal/VersionHistoryViewerModal'
import { VersionBrowserBar } from './VersionBrowserBar'
import { createNewVersionInstruction, restoreOldCertificate, updateAssignment } from '../../request'
import { PageLoadingIndicator } from '../PageLoadingIndicator'

type ContentProps = {
  exam: Exam
  isPresentation: boolean
}

const Content = ({ exam, isPresentation }: ContentProps) => {
  const { lt, t } = useLudosTranslation()
  const navigate = useNavigate()
  const { contentTypePluralFi, id, version } = useParams<{
    contentTypePluralFi: ContentTypePluralFi
    id: string
    version: string
  }>()
  const { state } = useLocation()
  const { isYllapitaja } = useUserDetails()
  const { teachingLanguage } = useContext(LudosContext)
  const [openVersionViewerModal, setOpenVersionViewerModal] = useState(false)

  const contentType = ContentTypeByContentTypePluralFi[contentTypePluralFi!]

  const isVersionBrowser = !!version

  const teachingLanguageOverrideIfSukoAssignment =
    exam === Exam.SUKO && contentType === ContentType.ASSIGNMENT ? Language.FI : teachingLanguage

  const { data, loading, error, refresh } = useFetch<ContentBaseOut>(
    `${ContentTypeSingularEn[contentType!]}/${exam}/${id}${isVersionBrowser ? `/${version}` : ''}`
  )

  const {
    data: versionList,
    error: versionListError,
    refresh: versionListRefresh
  } = useFetch<ContentBaseOut[]>(`${ContentTypeSingularEn[contentType!]}/${exam}/${id}/versions`, !isYllapitaja)

  const handleNavigation = useCallback(() => {
    if (state?.returnLocation) {
      navigate(state.returnLocation)
    } else {
      navigate(contentListPath(exam, contentType!))
    }
  }, [contentType, exam, navigate, state?.returnLocation])

  const restoreOldVersion = async (data: ContentBaseOut) => {
    if (isAssignment(data)) {
      await updateAssignment(data.id, data)
    } else if (isInstruction(data)) {
      const attachmentsToUpdate: AttachmentData[] = data.attachments.map((attachment) => ({
        name: attachment.name,
        attachment: attachment,
        language: attachment.language
      }))
      await createNewVersionInstruction(data.id, data, attachmentsToUpdate, [])
    } else if (isCertificate(data)) {
      await restoreOldCertificate(data.id, data.exam, data.version)
    }
  }

  if (loading) {
    return <PageLoadingIndicator />
  }

  if (error) {
    return <ContentError contentType={contentType!} error={error} />
  }

  if (!data || !contentType) {
    return null
  }

  return (
    <div className="min-h-[80vh] mt-10">
      {isYllapitaja && isVersionBrowser && versionList && (
        <VersionBrowserBar
          data={data}
          dataList={versionList!}
          restoreOldVersion={restoreOldVersion}
          openVersionBrowserClick={() => setOpenVersionViewerModal(true)}
          stopVersionBrowsing={() => {
            versionListRefresh()
            navigate(contentPagePath(data.exam, contentType!, data.id))
          }}
        />
      )}
      <div className="row">
        <div className="col w-full pr-5 md:w-9/12">
          <div className="row pb-3">
            <div className="col min-h-[40vh] w-full">
              <ContentHeader
                teachingLanguage={teachingLanguageOverrideIfSukoAssignment}
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
                  {versionListError ? (
                    <div className="p-0 ml-3">
                      <p className="text-red-primary">{t('version-control.muokkaushistoria-lataus-virhe')}</p>
                    </div>
                  ) : (
                    <Button
                      variant="buttonGhost"
                      customClass="p-0 ml-3"
                      disabled={!versionList}
                      onClick={() => setOpenVersionViewerModal(true)}
                      data-testid="version-history-btn">
                      <span className="row my-auto gap-1">
                        <Icon name="undo" color="text-green-primary" />
                        <p className="text-green-primary">{t('version-control.muokkaushistoria')}</p>
                      </span>
                    </Button>
                  )}
                  {openVersionViewerModal && (
                    <VersionHistoryViewerModal
                      open={openVersionViewerModal}
                      onClose={(refreshCall) => {
                        if (refreshCall) {
                          refresh()
                          versionListRefresh()
                        }
                        setOpenVersionViewerModal(false)
                      }}
                      restoreOldVersion={restoreOldVersion}
                      versionList={versionList!}
                      contentType={contentType!}
                    />
                  )}
                </div>
              )}

              {contentType === ContentType.ASSIGNMENT && isAssignment(data) && (
                <AssignmentContent
                  assignment={data}
                  exam={exam}
                  teachingLanguage={teachingLanguageOverrideIfSukoAssignment}
                  isPresentation={isPresentation}
                />
              )}

              {contentType === ContentType.CERTIFICATE && isCertificate(data) && (
                <CertificateContent certificate={data} teachingLanguage={teachingLanguage} />
              )}
              {contentType === ContentType.INSTRUCTION && isInstruction(data) && (
                <InstructionContent instruction={data} teachingLanguage={teachingLanguage} />
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
