import { Button } from './Button'
import { ChangeEvent, HTMLAttributes, useRef, useState } from 'react'
import { Spinner } from './Spinner'
import { useLudosTranslation } from '../hooks/useLudosTranslation'

const maxSizeInMiB = 5
const maxSizeInBytes = maxSizeInMiB * 1024 * 1024

const validateFileSize = (file: File) => file.size <= maxSizeInBytes

interface FileSelectorProps extends HTMLAttributes<HTMLInputElement> {
  acceptedMimeTypes: string
  btnText: string
  onFileSelected: (file: File[]) => void
  loading?: boolean
}

export const FileSelector = ({ acceptedMimeTypes, btnText, onFileSelected, loading, ...props }: FileSelectorProps) => {
  const { t } = useLudosTranslation()
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = event.target.files

    const noFileSelected = !files || files.length === 0
    if (noFileSelected) {
      return
    }

    const newFiles: File[] = []

    for (const file of files) {
      if (!validateFileSize(file)) {
        setError(t('error.liian-iso-tiedosto', { maxSize: `${maxSizeInMiB} MiB` }))
        return
      }
      newFiles.push(file)
    }
    // reset the input so that the same file can be selected again
    event.target.value = ''
    onFileSelected(newFiles)
  }

  return (
    <div className="my-6">
      <label>
        <input
          type="file"
          ref={hiddenFileInputRef}
          style={{ display: 'none' }}
          accept={acceptedMimeTypes}
          onChange={handleFileSelected}
          {...props}
        />
        <Button variant="buttonSecondary" onClick={() => hiddenFileInputRef.current?.click()} disabled={loading}>
          <span className="row items-center gap-5">
            {btnText}
            {loading && <Spinner />}
          </span>
        </Button>
      </label>

      {error && (
        <p className="text-red-primary" data-testid="file-upload-error-message">
          {error}
        </p>
      )}
    </div>
  )
}
