import { useTranslation } from 'react-i18next'
import { Spinner } from '../../Spinner'
import { ExternalLink } from '../../ExternalLink'
import { PREVIEW_CERTIFICATION_PDF_URL } from '../../../constants'
import { toLocaleDate } from '../../../formatUtils'
import { Attachment } from './AttachmentSelector'

interface AttachmentFileDetailViewProps {
  currentAttachment: Attachment | null
  newAttachment: File | null
  loading: boolean
}

interface FileDetails {
  fileName: string
  fileKey?: string
  fileUploadDate?: string
}

function fileDetailsFromProps({ currentAttachment, newAttachment }: AttachmentFileDetailViewProps): FileDetails | null {
  if (newAttachment) {
    return {
      fileName: newAttachment.name
    }
  } else if (currentAttachment) {
    return currentAttachment
  } else {
    return null
  }
}

export const AttachmentFileDetailView = ({
  currentAttachment,
  newAttachment,
  loading
}: AttachmentFileDetailViewProps) => {
  const { t } = useTranslation()

  const fileDetails = fileDetailsFromProps({ currentAttachment, newAttachment, loading })

  return (
    <div className="w-full md:w-1/3">
      <div className="grid grid-cols-6 gap-2">
        <p className="col-span-4 md:col-span-4">{t('file.nimi')}</p>
        <p className="col-span-2 md:col-span-2 md:block">{t('file.lisatty')}</p>
      </div>

      <div className="border-y border-gray-light" />
      {loading ? (
        <div className="py-2">
          <Spinner />
        </div>
      ) : (
        <>
          {fileDetails && (
            <div className="grid grid-cols-6 gap-2 py-2" data-testid={fileDetails.fileName}>
              {fileDetails.fileKey ? (
                <ExternalLink
                  className="col-span-4 text-green-primary"
                  url={`${PREVIEW_CERTIFICATION_PDF_URL}/${fileDetails.fileKey}`}>
                  {fileDetails.fileName}
                </ExternalLink>
              ) : (
                <span className="col-span-4">{fileDetails.fileName}</span>
              )}
              <p className="col-span-2">{toLocaleDate(fileDetails.fileUploadDate ?? new Date())}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
