import { ExternalLink } from '../../../ExternalLink'
import { DOWNLOAD_CERTIFICATE_ATTACHMENT_URL } from '../../../../constants'
import { toLocaleDate } from '../../../../formatUtils'
import { FileDetails } from '../../../../types'

type AttachmentDetailsProps = {
  attachmentDownloadUrlPrefix: string
  fileDetails: FileDetails
}

export const AttachmentDetails = ({ attachmentDownloadUrlPrefix, fileDetails }: AttachmentDetailsProps) => (
  <div className="grid grid-cols-11 gap-2 py-2" data-testid={fileDetails.fileName}>
    {fileDetails.fileKey ? (
      <ExternalLink
        className="col-span-4 text-green-primary"
        url={`${attachmentDownloadUrlPrefix}/${fileDetails.fileKey}`}>
        {fileDetails.fileName}
      </ExternalLink>
    ) : (
      <span className="col-span-4">{fileDetails.fileName}</span>
    )}
    <p className="col-span-2">{toLocaleDate(fileDetails.fileUploadDate ?? new Date())}</p>
  </div>
)
