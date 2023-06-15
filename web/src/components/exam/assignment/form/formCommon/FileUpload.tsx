import { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../../../../Button'
import { uploadFile } from '../../../../../formUtils'
import { useTranslation } from 'react-i18next'
import { FileUploaded } from './FileUploaded'

export type UploadFile = {
  fileName: string
  fileKey: string
  fileUploadDate: string
}

type FileUploadProps = {
  uploadedFile: UploadFile | null
  setUploadedFile: (file: UploadFile) => void
}

export const FileUpload = ({ uploadedFile, setUploadedFile }: FileUploadProps) => {
  const { t } = useTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      throw new Error('No file selected')
    }

    try {
      setLoading(true)
      const res = await uploadFile<UploadFile>(file)
      setUploadedFile(res)
    } catch (error) {
      console.error(error)
      setError('Tiedoston lataaminen epäonnistui')
    } finally {
      setLoading(false)
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
            {t('button.lisaa-liitetiedosto')}
          </Button>
        </label>
      </div>

      <FileUploaded file={uploadedFile} loading={loading} canDelete />

      {error && <p className="text-red">{error}</p>}
    </div>
  )
}
