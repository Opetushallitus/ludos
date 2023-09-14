import { CertificateIn } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { InternalLink } from '../../InternalLink'
import { StateTag } from '../../StateTag'
import { Icon } from '../../Icon'
import { toLocaleDate } from '../../../formatUtils'
import { PdfTag } from '../../PdfTag'
import { useUserDetails } from '../../../hooks/useUserDetails'
import { Button } from '../../Button'

type CertificateCardProps = {
  certificate: CertificateIn
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const navigate = useNavigate()
  const { isYllapitaja } = useUserDetails()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary"
      data-testid={`certificate-${certificate.id.toString()}`}>
      <div className="text-center">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${certificate.id}`}>
          {certificate.name}
        </InternalLink>
        {isYllapitaja && (
          <Button
            variant="buttonGhost"
            customClass="p-0 ml-2"
            onClick={() => navigate(`muokkaus/${certificate.id}`)}
            data-testid={`certificate-${certificate.id.toString()}-edit`}>
            <Icon name="muokkaa" color="text-green-primary" />
          </Button>
        )}
      </div>
      <div className="row mt-3 justify-between">
        <div className="w-20">{isYllapitaja && <StateTag state={certificate.publishState} />}</div>
        <p className="text-center text-xs">{toLocaleDate(certificate.createdAt)}</p>
        <PdfTag />
      </div>
    </div>
  )
}
