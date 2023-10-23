import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../../../Button'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from './AttachmentFileDetailView'
import { AttachmentData, AttachmentLanguage, ContentType } from '../../../../types'

interface AttachmentSelectorProps {
  contentType: ContentType
  handleNewAttachmentSelected: (attachments: AttachmentData[], language?: AttachmentLanguage) => void
  language: AttachmentLanguage // used mostly for data-testid tagginf
  attachmentData?: AttachmentData[] | AttachmentData
  handleNewAttachmentName?: (newName: string, index: number, language: AttachmentLanguage) => void
  deleteFileByIndex?: (index: number, lang: AttachmentLanguage) => void
}

export const AttachmentSelector = ({
  contentType,
  attachmentData,
  handleNewAttachmentSelected,
  handleNewAttachmentName,
  deleteFileByIndex,
  language
}: AttachmentSelectorProps) => {
  const { t } = useTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const isMultiple = Array.isArray(attachmentData)

  const handleAttachmentSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const attachmentFiles = event.target.files

    if (!attachmentFiles || attachmentFiles.length === 0) {
      // No files were selected
      return
    }

    const newFiles: File[] = []
    const maxSizeInMiB = 5
    const maxSizeInBytes = maxSizeInMiB * 1024 * 1024

    for (const file of attachmentFiles) {
      if (file.size > maxSizeInBytes) {
        setError(t('error.liian-iso-tiedosto', { maxSize: `${maxSizeInMiB} MiB` }))
        return
      }
      newFiles.push(file)
    }

    try {
      if (isMultiple) {
        handleNewAttachmentSelected(
          newFiles.map((it) => ({ file: it, name: it.name })),
          language
        )
      } else {
        handleNewAttachmentSelected(
          [
            {
              file: newFiles[0],
              name: newFiles[0].name
            }
          ],
          language
        )
      }
      // reset the input so that the same file can be selected again
      event.target.value = ''
    } catch (e) {
      console.warn('Error uploading file', e)
      setError(t('error.lataaminen-epaonnistui'))
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
      <div className="my-6">
        <input
          type="file"
          id={`fileInput-${language}`}
          ref={hiddenFileInputRef}
          multiple
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleAttachmentSelected}
          data-testid={`file-input-${language}`}
        />
        <label htmlFor={`fileInput-${language}`}>
          <Button variant="buttonSecondary" onClick={() => hiddenFileInputRef.current?.click()}>
            {isMultiple
              ? t('button.lisaa-liitetiedostot')
              : !attachmentData
              ? t('button.lisaa-liitetiedosto')
              : t('button.vaihda-liitetiedosto')}
          </Button>
        </label>
      </div>
      {showFileDetails() && (
        <AttachmentFileDetailView
          contentType={contentType}
          attachments={attachmentData!}
          handleAttachmentNameChange={handleAttachmentNameChange}
          deleteFileByIndex={(index) => (deleteFileByIndex ? deleteFileByIndex(index, language ?? 'fi') : null)}
          language={language}
        />
      )}
      {error && (
        <p className="text-red-primary" data-testid="file-upload-error-message">
          {error}
        </p>
      )}
    </div>
  )
}
