import React, { ChangeEvent, useRef, useState } from 'react'
import { Button } from '../../../../Button'
import { Icon } from '../../../../Icon'
import { uploadFile } from '../../../../../formUtils'
import { toLocaleDate } from '../../../../../formatUtils'

export type UploadFile = {
  fileName: string
  fileUrl: string
  fileUploadDate: string
}

export const FileUpload = ({
  uploadedFile,
  setUploadedFile
}: {
  uploadedFile: UploadFile | null
  setUploadedFile: (file: UploadFile) => void
}) => {
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      throw new Error('No file selected')
    }

    // upload the file to backend
    try {
      setLoading(true)
      const res = await uploadFile<UploadFile>(file)
      setUploadedFile(res)
    } catch (error) {
      console.error(error)
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
            Lisää liitetiedosto
          </Button>
        </label>
      </div>

      {uploadedFile && <UploadedFile file={uploadedFile} canDelete />}
    </div>
  )
}

export const UploadedFile = ({ file, canDelete }: { file: UploadFile; canDelete?: boolean }) => (
  <div className="w-full md:w-1/2">
    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
      <p className="col-span-3 md:col-span-3">Tiedoston nimi</p>
      <p className="hidden md:col-span-3 md:block">Lisätty</p>
    </div>

    <div className="border-y border-gray-light" />
    <div className="grid grid-cols-5 gap-2 py-2 md:grid-cols-6">
      <p className="col-span-4 text-green-primary md:col-span-3">{file.fileName}</p>
      <p className="hidden md:col-span-2 md:block">{toLocaleDate(file.fileUploadDate)}</p>
      {canDelete && (
        <div className="text-center">
          <Icon name="poista" color="text-green-primary" />
        </div>
      )}
    </div>
  </div>
)
