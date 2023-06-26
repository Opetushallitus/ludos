import { CertificateIn } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'
import { PdfTag } from '../../PdfTag'

type CertificateCardProps = {
  certificate: CertificateIn
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`certificate-${certificate.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${certificate.id}`}>
          {certificate.name}
        </InternalLink>
        <Icon
          name="muokkaa"
          color="text-green-primary"
          dataTestId={`certificate-${certificate.id.toString()}-edit`}
          onClick={() =>
            navigate('update', {
              state: {
                data: certificate
              }
            })
          }
          customClass="ml-2"
        />
      </div>
      <div className="row mt-3 justify-between">
        <StateTag state={certificate.publishState} />
        <p className="text-center text-xs">{toLocaleDate(certificate.createdAt)}</p>
        <PdfTag />
      </div>
    </div>
  )
}
