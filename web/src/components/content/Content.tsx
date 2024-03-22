import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../Button'
import {
  ContentBaseOut,
  ContentType,
  ContentTypeByContentTypePluralFi,
  ContentTypePluralFi,
  ContentTypeSingularEn,
  Exam,
  isAssignment,
  isCertificate,
  isInstruction,
  Language
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
import { restoreOldContentVersion } from '../../request'
import { PageLoadingIndicator } from '../PageLoadingIndicator'
import { ListTabs } from '../ListTabs'
import { ContentBreadcrumbs } from '../Breadcrumbs'
import { getContentName } from '../../utils/assignmentUtils'

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

  const teachingLanguageOverride =
    exam === Exam.SUKO && (contentType === ContentType.ASSIGNMENT || contentType === ContentType.CERTIFICATE)
      ? Language.FI
      : teachingLanguage

  const {
    data,
    isFetching,
    error,
    refetch: refetchContent
  } = useFetch<ContentBaseOut>(
    ['content'],
    `${ContentTypeSingularEn[contentType!]}/${exam}/${id}${isVersionBrowser ? `/${version}` : ''}`
  )

  const {
    data: versionList,
    error: versionListError,
    refetch: refetchVersionList
  } = useFetch<ContentBaseOut[]>(
    ['version'],
    `${ContentTypeSingularEn[contentType!]}/${exam}/${id}/versions`,
    isYllapitaja
  )

  const handleNavigation = useCallback(() => {
    if (state?.returnLocation) {
      navigate(state.returnLocation)
    } else {
      navigate(contentListPath(exam, contentType!))
    }
  }, [contentType, exam, navigate, state?.returnLocation])

  const restoreOldVersion = (data: ContentBaseOut) =>
    restoreOldContentVersion(data.exam, data.contentType, data.id, data.version)

  if (isFetching) {
    return <PageLoadingIndicator />
  }

  if (error) {
    return <ContentError contentType={contentType!} error={error} />
  }

  if (!data || !contentType) {
    return null
  }

  return (
    <div className="min-h-[80vh] mt-5">
      <div className="py-5">
        <ContentBreadcrumbs exam={exam} name={getContentName(data, teachingLanguage)} />
      </div>

      <div className="mb-5">
        <ListTabs exam={exam} />
      </div>

      {isYllapitaja && isVersionBrowser && versionList && (
        <VersionBrowserBar
          data={data}
          dataList={versionList!}
          restoreOldVersion={restoreOldVersion}
          openVersionBrowserClick={() => setOpenVersionViewerModal(true)}
          stopVersionBrowsing={async () => {
            await refetchVersionList()
            navigate(contentPagePath(data.exam, contentType!, data.id))
          }}
        />
      )}
      <div className="row">
        <div className="col w-full pr-5 md:w-9/12">
          <div className="row pb-3">
            <div className="col min-h-[40vh] w-full">
              <ContentHeader teachingLanguage={teachingLanguageOverride} data={data} isPresentation={isPresentation} />

              {!isPresentation && isYllapitaja && (
                <div className="row">
                  <StateTag state={data.publishState} />
                  <InternalLink
                    className="row ml-3 gap-1 hover:cursor-pointer hover:underline"
                    to={editingFormPath(data)}
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
                      onClose={async (refreshCall) => {
                        if (refreshCall) {
                          await refetchVersionList()
                          await refetchContent()
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
                  teachingLanguage={teachingLanguageOverride}
                  isPresentation={isPresentation}
                />
              )}

              {contentType === ContentType.CERTIFICATE && isCertificate(data) && (
                <CertificateContent certificate={data} teachingLanguage={teachingLanguage} />
              )}
              {contentType === ContentType.INSTRUCTION && isInstruction(data) && (
                <InstructionContent
                  instruction={data}
                  teachingLanguage={teachingLanguage}
                  isVersionBrowser={isVersionBrowser}
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
