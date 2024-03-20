import { ChangeEvent, HTMLAttributes, RefObject } from 'react'
import { useNotification } from '../../../../contexts/NotificationContext'
import { ImageDtoOut } from '../../../../types'
import { uploadImage } from '../../../../request'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'

const maxSizeInMiB = 5
const maxSizeInBytes = maxSizeInMiB * 1024 * 1024

const validateFileSize = (file: File) => file.size <= maxSizeInBytes

interface FileSelectorProps extends HTMLAttributes<HTMLInputElement> {
  imageFileInputRef: RefObject<HTMLInputElement>
  onImageUploaded: (imageDtoOut: ImageDtoOut) => void
}

export const ImageSelector = ({ imageFileInputRef, onImageUploaded }: FileSelectorProps) => {
  const { t } = useLudosTranslation()
  const { setNotification } = useNotification()

  const uploadSelectedFile = async (file: File) => {
    try {
      const imgDtoOut = await uploadImage(file)
      onImageUploaded(imgDtoOut)
    } catch (e) {
      setNotification({ message: t('error.lataaminen-epaonnistui'), type: 'error' })
      console.error(e)
    }
  }

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    const noFileSelected = !files || files.length === 0
    if (noFileSelected) {
      return
    }

    const newFiles: File[] = []

    for (const file of files) {
      if (!validateFileSize(file)) {
        setNotification({ message: t('error.liian-iso-tiedosto', { maxSize: `${maxSizeInMiB} MiB` }), type: 'error' })
        return
      }
      newFiles.push(file)
    }
    // reset the input so that the same file can be selected again
    event.target.value = ''
    for (const newFile of newFiles) {
      void uploadSelectedFile(newFile)
    }
  }

  return (
    <input
      type="file"
      data-testid="image-file-input"
      ref={imageFileInputRef}
      style={{ display: 'none' }}
      accept="image/jpeg, image/png, image/gif, image/svg+xml"
      onChange={handleImageSelected}
    />
  )
}
