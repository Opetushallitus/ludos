import { useTranslation } from 'react-i18next'
import { Spinner } from '../../../Spinner'
import { AttachmentData, FileDetails } from '../../../../types'
import { AttachmentDetails } from './AttachmentDetails'
import { AttachmentDetailsList } from './AttachmentDetailsList'
import { useEffect, useState } from 'react'

interface AttachmentFileDetailViewProps {
  attachments: AttachmentData[] | AttachmentData
  handleAttachmentNameChange: (newName: string, index: number) => void
  deleteFileByIndex?: (index: number) => void
  loading?: boolean
}

export const AttachmentFileDetailView = ({
  attachments,
  handleAttachmentNameChange,
  deleteFileByIndex,
  loading
}: AttachmentFileDetailViewProps) => {
  const { t } = useTranslation()
  const [attachmentNames, setAttachmentNames] = useState<string[]>([])

  useEffect(() => {
    if (Array.isArray(attachments)) {
      setAttachmentNames(attachments.map((it) => it.name))
    } else {
      setAttachmentNames([attachments.name])
    }
  }, [attachments])

  const fileDetails: FileDetails[] | FileDetails = Array.isArray(attachments)
    ? (attachments.map((it) => ({
        fileName: it.file?.name || it.attachment?.fileName,
        fileKey: it.file?.name || it.attachment?.fileKey,
        fileUploadDate: it.attachment?.fileUploadDate || Date.now(),
        name: it.name
      })) as FileDetails[])
    : ({
        fileName: attachments?.file?.name || attachments.attachment?.fileName,
        fileKey: attachments.attachment?.fileKey,
        fileUploadDate: attachments.attachment?.fileUploadDate || Date.now(),
        name: attachments?.name || attachments.file?.name
      } as FileDetails)

  return (
    <div className="w-full md:w-3/4">
      <div className="grid grid-cols-11 gap-2">
        <p className="col-span-3 md:col-span-4">{t('file.nimi')}</p>
        {fileDetails && Array.isArray(fileDetails) && (
          <p className="col-span-4 md:col-span-4">{t('file.liitteen-nimi')}</p>
        )}
        <p className="col-span-2 md:col-span-2 md:block">{t('file.lisatty')}</p>
      </div>

      <div className="border-y border-gray-light" />
      {loading ? (
        <div className="py-2">
          <Spinner />
        </div>
      ) : (
        <>
          {fileDetails && (
            <>
              {Array.isArray(fileDetails) ? (
                <AttachmentDetailsList
                  {...{
                    fileDetails,
                    attachmentNames,
                    handleAttachmentNameChange,
                    deleteFileByIndex
                  }}
                />
              ) : (
                <AttachmentDetails fileDetails={fileDetails} />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
