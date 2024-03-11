import { Icon } from './Icon'
import { CERTIFICATE_URL } from '../constants'
import { ExternalLink } from './ExternalLink'
import { Exam } from '../types'

type PdfViewerLinkTagProps = {
  exam: Exam
  fileKey: string
}

export const PdfViewerLinkTag = ({ exam, fileKey }: PdfViewerLinkTagProps) => (
  <ExternalLink
    className="row my-auto gap-2 rounded bg-gray-bg px-2 col-span-5 break-all text-green-primary"
    url={`${CERTIFICATE_URL}/${exam}/attachment/${fileKey}`}
    hideIcon
    data-testid="download-pdf">
    <Icon name="pdf" color="text-black" />
    <p className="text-xss">Pdf</p>
  </ExternalLink>
)
