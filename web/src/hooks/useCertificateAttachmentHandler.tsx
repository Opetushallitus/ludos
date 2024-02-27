import { useState } from 'react'
import { AttachmentData, AttachmentLanguage, Language } from '../types'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'

export function useCertificateAttachmentHandler(setValue: UseFormSetValue<any>, watch: UseFormWatch<any>) {
  const [newAttachmentFi, setNewAttachmentFi] = useState<File | null>(null)
  const [newAttachmentSv, setNewAttachmentSv] = useState<File | null>(null)

  const watchAttachmentFi = watch('attachmentFi')
  const watchAttachmentSv = watch('attachmentSv')

  function handleNewAttachmentSelected(newAttachment: AttachmentData[], language?: AttachmentLanguage) {
    const file = newAttachment[0].file

    if (file && language) {
      if (language === Language.FI) {
        setNewAttachmentFi(file)
        setValue(
          'attachmentFi',
          {
            fileName: file.name,
            name: file.name,
            fileKey: ''
          },
          {
            shouldValidate: true
          }
        )
      } else if (language === Language.SV) {
        setNewAttachmentSv(file)
        setValue(
          'attachmentSv',
          {
            fileName: file.name,
            name: file.name,
            fileKey: ''
          },
          {
            shouldValidate: true
          }
        )
      }
    }
  }

  function currentAttachment(lang: Language): AttachmentData | undefined {
    if (lang === Language.FI) {
      return newAttachmentFi
        ? {
            file: newAttachmentFi,
            name: newAttachmentFi.name
          }
        : watchAttachmentFi
          ? {
              attachment: {
                name: watchAttachmentFi.fileName,
                fileName: watchAttachmentFi.fileName,
                fileKey: watchAttachmentFi.fileKey,
                fileUploadDate: watchAttachmentFi.fileUploadDate,
                language: watchAttachmentFi.language || 'FI'
              },
              name: watchAttachmentFi.name || ''
            }
          : undefined
    } else if (lang === Language.SV) {
      return newAttachmentSv
        ? {
            file: newAttachmentSv,
            name: newAttachmentSv.name
          }
        : watchAttachmentSv
          ? {
              attachment: {
                name: watchAttachmentSv.fileName,
                fileName: watchAttachmentSv.fileName,
                fileKey: watchAttachmentSv.fileKey,
                fileUploadDate: watchAttachmentSv.fileUploadDate,
                language: watchAttachmentSv.language || 'SV'
              },
              name: watchAttachmentSv.name || ''
            }
          : undefined
    }
  }

  return {
    handleNewAttachmentSelected,
    currentAttachment,
    newAttachmentFi,
    newAttachmentSv
  }
}
