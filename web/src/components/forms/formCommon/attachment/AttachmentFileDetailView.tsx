import { Spinner } from '../../../Spinner'
import { AttachmentData, ContentType, Exam, FileDetails, Language } from '../../../../types'
import { AttachmentDetails } from './AttachmentDetails'
import { AttachmentDetailsList } from './AttachmentDetailsList'
import { CERTIFICATE_URL, INSTRUCTION_URL } from '../../../../constants'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'

interface AttachmentFileDetailViewProps {
  exam: Exam
  contentType: ContentType
  attachments: AttachmentData[] | AttachmentData
  handleAttachmentNameChange: (newName: string, index: number, language: Language) => void
  deleteFileByIndex?: (index: number) => void
  loading?: boolean
  language?: Language
}

export const AttachmentFileDetailView = ({
  exam,
  contentType,
  attachments,
  handleAttachmentNameChange,
  deleteFileByIndex,
  loading,
  language = Language.FI
}: AttachmentFileDetailViewProps) => {
  const { t } = useLudosTranslation()
  const attachmentDownloadUrlPrefix = `${
    contentType === ContentType.INSTRUCTION ? INSTRUCTION_URL : CERTIFICATE_URL
  }/${exam}/attachment`

  const fileDetails: FileDetails[] | FileDetails = Array.isArray(attachments)
    ? (attachments.map((it) => ({
        fileName: it.file?.name || it.attachment?.fileName,
        fileKey: it.attachment?.fileKey,
        fileUploadDate: it.attachment?.fileUploadDate || Date.now(),
        name: it.name
      })) as FileDetails[])
    : ({
        fileName: attachments?.file?.name || attachments.attachment?.fileName,
        fileKey: attachments.attachment?.fileKey,
        fileUploadDate: attachments.attachment?.fileUploadDate || Date.now(),
        name: attachments?.name || attachments.file?.name
      } as FileDetails)

  return (
    <div className="w-full md:w-3/4">
      <div className="grid grid-cols-11 gap-2">
        <p className="col-span-4 break-all md:col-span-4">{t('file.nimi')}</p>
        {fileDetails && Array.isArray(fileDetails) && (
          <p className="col-span-4 break-all md:col-span-4">{t('file.liitteen-nimi')}</p>
        )}
        <p className="md:block">{t('file.lisatty')}</p>
      </div>

      <div className="border-y border-gray-light" />
      {loading ? (
        <Spinner className="py-2" />
      ) : (
        <>
          {fileDetails && (
            <div data-testid={`attachment-details-${language}`}>
              {Array.isArray(fileDetails) ? (
                <AttachmentDetailsList
                  handleAttachmentNameChange={handleAttachmentNameChange}
                  deleteFileByIndex={deleteFileByIndex}
                  fileDetails={fileDetails}
                  attachmentDownloadUrlPrefix={attachmentDownloadUrlPrefix}
                  language={language}
                />
              ) : (
                <AttachmentDetails
                  attachmentDownloadUrlPrefix={attachmentDownloadUrlPrefix}
                  fileDetails={fileDetails}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
