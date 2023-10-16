import { CertificateDtoOut } from '../../../../types'
import { InternalLink } from '../../../InternalLink'
import { StateTag } from '../../../StateTag'
import { Icon } from '../../../Icon'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { PdfTag } from '../../../PdfTag'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { muokkausKey } from '../../../LudosRoutes'

type CertificateCardProps = {
  certificate: CertificateDtoOut
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const { isYllapitaja } = useUserDetails()

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary flex flex-col"
      data-testid={`certificate-${certificate.id.toString()}`}>
      <div className="text-center flex-1 px-2 break-words">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${certificate.id}`}>
          {certificate.name}
        </InternalLink>
        {isYllapitaja && (
          <InternalLink
            className="p-0 ml-2"
            to={`${muokkausKey}/${certificate.id}`}
            data-testid={`certificate-${certificate.id.toString()}-edit`}>
            <Icon name="muokkaa" color="text-green-primary" />
          </InternalLink>
        )}
      </div>
      <p className="mb-2 mt-2 text-center text-xs">{certificate.description}</p>
      <div className="row mt-3 justify-between">
        <div className="w-20">{isYllapitaja && <StateTag state={certificate.publishState} />}</div>
        <p className="text-center text-xs">{toLocaleDate(certificate.createdAt)}</p>
        <PdfTag />
      </div>
    </div>
  )
}
