import { Icon } from './Icon'
import { DOWNLOAD_CERTIFICATE_ATTACHMENT_URL } from '../constants'
import { ExternalLink } from './ExternalLink'

type PdfViewerLinkTagProps = {
  fileKey: string
}

export const PdfViewerLinkTag = ({ fileKey }: PdfViewerLinkTagProps) => (
  <ExternalLink
    className="row my-auto gap-2 rounded bg-gray-bg px-2 col-span-5 break-all text-green-primary"
    url={`${DOWNLOAD_CERTIFICATE_ATTACHMENT_URL}/${fileKey}`}
    hideIcon
    data-testid="download-pdf">
    <Icon name="pdf" color="text-black" />
    <p className="text-xss">Pdf</p>
  </ExternalLink>
)
