import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { AttachmentData, ContentType, Exam, Language } from '../../../../types'
import { FileSelector } from '../../../FileSelector'
import { FormError } from '../FormErrors'
import { AttachmentFileDetailView } from './AttachmentFileDetailView'

interface AttachmentSelectorProps {
  name: string
  exam: Exam
  contentType: ContentType
  handleNewAttachmentSelected: (attachments: AttachmentData[], language?: Language) => void
  language: Language // used mostly for data-testid tagging
  error?: string
  attachmentData?: AttachmentData[] | AttachmentData
  handleNewAttachmentName?: (newName: string, index: number, language: Language) => void
  deleteFileByIndex?: (index: number, lang: Language) => void
  loading?: boolean
}

export const AttachmentSelector = ({
  name,
  exam,
  contentType,
  attachmentData,
  handleNewAttachmentSelected,
  handleNewAttachmentName,
  deleteFileByIndex,
  language,
  loading,
  error
}: AttachmentSelectorProps) => {
  const { t } = useLudosTranslation()
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

  const handleAttachmentNameChange = (newName: string, index: number, language: Language) => {
    if (handleNewAttachmentName) {
      handleNewAttachmentName(newName, index, language)
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
          exam={exam}
          contentType={contentType}
          attachments={attachmentData!}
          handleAttachmentNameChange={handleAttachmentNameChange}
          deleteFileByIndex={(index) => (deleteFileByIndex ? deleteFileByIndex(index, language ?? 'FI') : null)}
          language={language}
        />
      )}

      <FormError error={error} name={name} />
    </div>
  )
}
