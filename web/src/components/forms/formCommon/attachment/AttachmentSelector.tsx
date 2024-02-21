import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from './AttachmentFileDetailView'
import { AttachmentData, AttachmentLanguage, ContentType } from '../../../../types'
import { FileSelector } from '../../../FileSelector'
import { FormError } from '../FormErrors'

interface AttachmentSelectorProps {
  name: string
  contentType: ContentType
  handleNewAttachmentSelected: (attachments: AttachmentData[], language?: AttachmentLanguage) => void
  language: AttachmentLanguage // used mostly for data-testid tagging
  error?: string
  attachmentData?: AttachmentData[] | AttachmentData
  handleNewAttachmentName?: (newName: string, index: number, language: AttachmentLanguage) => void
  deleteFileByIndex?: (index: number, lang: AttachmentLanguage) => void
  loading?: boolean
}

export const AttachmentSelector = ({
  name,
  contentType,
  attachmentData,
  handleNewAttachmentSelected,
  handleNewAttachmentName,
  deleteFileByIndex,
  language,
  loading,
  error
}: AttachmentSelectorProps) => {
  const { t } = useTranslation()
  const isMultiple = Array.isArray(attachmentData)

  const handleAttachmentSelected = async (uploadedFiles: File[]) => {
    if (isMultiple) {
      handleNewAttachmentSelected(
        uploadedFiles.map((it) => ({ file: it, name: it.name })),
        language
      )
    } else {
      handleNewAttachmentSelected(
        [
          {
            file: uploadedFiles[0],
            name: uploadedFiles[0].name
          }
        ],
        language
      )
    }
  }

  const handleAttachmentNameChange = (newName: string, index: number) => {
    if (handleNewAttachmentName) {
      handleNewAttachmentName(newName, index, language ?? 'fi')
    }
  }

  const showFileDetails = () => {
    if (Array.isArray(attachmentData)) {
      return attachmentData.length > 0
    }

    return attachmentData !== undefined
  }

  return (
    <div>
      <FileSelector
        acceptedMimeTypes="application/pdf"
        btnText={
          isMultiple
            ? t('button.lisaa-liitetiedostot')
            : !attachmentData
              ? t('button.lisaa-liitetiedosto')
              : t('button.vaihda-liitetiedosto')
        }
        onFileSelected={handleAttachmentSelected}
        loading={loading}
        data-testid={`file-input-${language}`}
      />
      {showFileDetails() && (
        <AttachmentFileDetailView
          contentType={contentType}
          attachments={attachmentData!}
          handleAttachmentNameChange={handleAttachmentNameChange}
          deleteFileByIndex={(index) => (deleteFileByIndex ? deleteFileByIndex(index, language ?? 'fi') : null)}
          language={language}
        />
      )}

      <FormError error={error} name={name} />
    </div>
  )
}
