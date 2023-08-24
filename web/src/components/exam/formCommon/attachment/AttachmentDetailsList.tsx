import { FileDetails } from '../../../../types'
import { ExternalLink } from '../../../ExternalLink'
import { DOWNLOAD_CERTIFICATE_ATTACHMENT_URL } from '../../../../constants'
import { toLocaleDate } from '../../../../formatUtils'
import { Icon } from '../../../Icon'
import { useState } from 'react'
import { DeleteModal } from '../../../Modal/DeleteModal'
import { useTranslation } from 'react-i18next'

type AttachmentDetailsListProps = {
  attachmentDownloadUrlPrefix: string
  fileDetails: FileDetails[]
  attachmentNames: string[]
  handleAttachmentNameChange: (newName: string, index: number) => void
  deleteFileByIndex?: (index: number) => void
  language?: 'fi' | 'sv'
}

export const AttachmentDetailsList = ({
  attachmentDownloadUrlPrefix,
  fileDetails,
  attachmentNames,
  handleAttachmentNameChange,
  deleteFileByIndex,
  language
}: AttachmentDetailsListProps) => {
  const { t } = useTranslation()
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null)

  const handleDeleteClick = () => {
    if (indexToDelete !== null && deleteFileByIndex) {
      deleteFileByIndex(indexToDelete!)
    }
    setIndexToDelete(null)
  }

  return (
    <>
      {fileDetails.map((attachment, index) => (
        <div key={index} className="grid grid-cols-11 gap-2 py-2" data-testid={attachment.fileName}>
          {attachment.fileKey ? (
            <ExternalLink
              className="col-span-4 text-green-primary"
              url={`${attachmentDownloadUrlPrefix}/${attachment.fileKey}`}>
              {attachment.fileName}
            </ExternalLink>
          ) : (
            <span className="col-span-4">{attachment.fileName}</span>
          )}
          <input
            className="col-span-4 border border-gray-secondary px-1"
            value={attachmentNames![index] || ''}
            onChange={(e) => handleAttachmentNameChange(e.target.value, index)}
            placeholder={attachmentNames![index] || ''}
            data-testid={`attachment-name-input-${index}-${language}`}
          />
          <p className="col-span-2">{toLocaleDate(attachment.fileUploadDate ?? new Date())}</p>
          {deleteFileByIndex && (
            <div className="text-center">
              <Icon
                name="poista"
                color="text-green-primary"
                dataTestId={`delete-attachment-icon-${index}`}
                onClick={() => setIndexToDelete(index)}
              />
            </div>
          )}
        </div>
      ))}

      <DeleteModal
        modalTitle={t('file.ohje-poista-liite')}
        open={indexToDelete !== null}
        onDeleteAction={handleDeleteClick}
        onClose={() => setIndexToDelete(null)}>
        <div className="h-[15vh] p-6">
          <p>
            {t('file.ohje-poista-liite-teksti', {
              liite: indexToDelete !== null ? fileDetails[indexToDelete].fileName : ''
            })}
          </p>
        </div>
      </DeleteModal>
    </>
  )
}
