import { ExternalLink } from '../../../ExternalLink'
import { DOWNLOAD_CERTIFICATE_PDF_URL } from '../../../../constants'
import { toLocaleDate } from '../../../../formatUtils'
import { FileDetails } from '../../../../types'

export const AttachmentDetails = ({ fileDetails }: { fileDetails: FileDetails }) => (
  <div className="grid grid-cols-11 gap-2 py-2" data-testid={fileDetails.fileName}>
    {fileDetails.fileKey ? (
      <ExternalLink
        className="col-span-4 text-green-primary"
        url={`${DOWNLOAD_CERTIFICATE_PDF_URL}/${fileDetails.fileKey}`}>
        {fileDetails.fileName}
      </ExternalLink>
    ) : (
      <span className="col-span-4">{fileDetails.fileName}</span>
    )}
    <p className="col-span-2">{toLocaleDate(fileDetails.fileUploadDate ?? new Date())}</p>
  </div>
)
