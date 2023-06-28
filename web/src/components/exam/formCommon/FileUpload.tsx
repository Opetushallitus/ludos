import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../../Button'
import { uploadFile } from '../../../request'
import { useTranslation } from 'react-i18next'
import { FileUploaded } from './FileUploaded'
import { FILE_UPLOAD_ERRORS, getErrorMessage } from '../../../errorUtils'

export type UploadFile = {
  fileName: string
  fileKey: string
  fileUploadDate: string
}

type FileUploadProps = {
  assignmentId?: number
  uploadedFile: UploadFile | null
  setUploadedFile: (file: UploadFile) => void
}

export const FileUpload = ({ assignmentId, uploadedFile, setUploadedFile }: FileUploadProps) => {
  const { t } = useTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setError('NO_FILE')
      return
    }

    const fileSizeInBytes = file.size
    const maxSizeInBytes = 5 * 1024 * 1024 // 5MB
    if (fileSizeInBytes > maxSizeInBytes) {
      setError('FILE_TOO_LARGE')
      return
    }

    try {
      setLoading(true)
      const res = await uploadFile<UploadFile>(file, assignmentId)
      setUploadedFile(res)
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
          onChange={handleFileUpload}
        />
        <label htmlFor="fileInput">
          <Button variant="buttonSecondary" onClick={() => hiddenFileInputRef.current?.click()} disabled={loading}>
            {t(`button.${!uploadedFile ? 'lisaa' : 'vaihda'}-liitetiedosto`)}
          </Button>
        </label>
      </div>

      <FileUploaded file={uploadedFile} loading={loading} />

      {error && <p className="text-red">{errorMessage(error)}</p>}
    </div>
  )
}
