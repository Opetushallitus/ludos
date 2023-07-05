import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../../Button'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from './AttachmentFileDetailView'
import { FILE_UPLOAD_ERRORS, getErrorMessage } from '../../../errorUtils'

export interface Attachment {
  fileName: string
  fileKey?: string
  fileUploadDate: string
}

interface AttachmentSelectorProps {
  currentAttachment: Attachment | null
  newAttachment: File | null
  setNewAttachment: (newAttachment: File) => void
}

export const AttachmentSelector = ({ currentAttachment, newAttachment, setNewAttachment }: AttachmentSelectorProps) => {
  const { t } = useTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAttachmentSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const attachmentFile = event.target.files?.length === 1 && event.target.files[0]

    if (!attachmentFile) {
      setError('NO_FILE')
      return
    }

    const fileSizeInBytes = attachmentFile.size
    const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
    if (fileSizeInBytes > maxSizeInBytes) {
      setError('FILE_TOO_LARGE')
      return
    }

    try {
      setLoading(true)
      setNewAttachment(attachmentFile)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const errorMessage = (error: string) => {
    // if error is in FILE_UPLOAD_ERRORS then return error message from translation
    if (Object.keys(FILE_UPLOAD_ERRORS).includes(error)) {
      const tKey = error as keyof typeof FILE_UPLOAD_ERRORS

      if (tKey === 'FILE_TOO_LARGE') {
        return t(`error.${FILE_UPLOAD_ERRORS[tKey]}`, { maxSize: '5mb' })
      }

      return t(`error.${FILE_UPLOAD_ERRORS[tKey]}`)
    } else {
      return t('error.lataaminen-epaonnistui')
    }
  }

  return (
    <div>
      <div className="my-6">
        <input
          type="file"
          id="fileInput"
          ref={hiddenFileInputRef}
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleAttachmentSelected}
        />
        <label htmlFor="fileInput">
          <Button variant="buttonSecondary" onClick={() => hiddenFileInputRef.current?.click()} disabled={loading}>
            {t(`button.${!currentAttachment ? 'lisaa-liitetiedosto' : 'vaihda-liitetiedosto'}`)}
          </Button>
        </label>
      </div>

      <AttachmentFileDetailView currentAttachment={currentAttachment} newAttachment={newAttachment} loading={loading} />

      {error && <p className="text-red">{errorMessage(error)}</p>}
    </div>
  )
}
