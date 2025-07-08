import { useState } from 'react'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { FileDetails, Language } from '../../../../types'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { Button } from '../../../Button'
import { ExternalLink } from '../../../ExternalLink'
import { Icon } from '../../../Icon'
import { DeleteModal } from '../../../modal/DeleteModal'

type AttachmentDetailsListProps = {
  attachmentDownloadUrlPrefix: string
  fileDetails: FileDetails[]
  handleAttachmentNameChange: (newName: string, index: number, language: Language) => void
  deleteFileByIndex?: (index: number) => void
  language: Language
}

export const AttachmentDetailsList = ({
  attachmentDownloadUrlPrefix,
  fileDetails,
  handleAttachmentNameChange,
  language,
  deleteFileByIndex
}: AttachmentDetailsListProps) => {
  const { t } = useLudosTranslation()
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
              url={`${attachmentDownloadUrlPrefix}/${attachment.fileKey}`}
            >
              {attachment.fileName}
            </ExternalLink>
          ) : (
            <span className="col-span-4">{attachment.fileName}</span>
          )}
          <input
            className="col-span-4 border border-gray-secondary px-1"
            value={attachment.name}
            onChange={(e) => handleAttachmentNameChange(e.target.value, index, language)}
            data-testid={`attachment-name-input-${index}-${language}`}
          />
          <p className="col-span-2">{toLocaleDate(attachment.fileUploadDate ?? new Date())}</p>
          {deleteFileByIndex && (
            <Button
              variant="buttonGhost"
              onClick={() => setIndexToDelete(index)}
              customClass="p-0 hover:cursor-pointer hover:bg-white"
              data-testid={`delete-attachment-icon-${index}`}
            >
              <Icon name="poista" color="text-black" customClass="hover:bg-gray-secondary" size="sm" />
            </Button>
          )}
        </div>
      ))}

      <DeleteModal
        modalTitle={t('file.ohje-poista-liite')}
        open={indexToDelete !== null}
        onDeleteAction={handleDeleteClick}
        onClose={() => setIndexToDelete(null)}
      >
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
