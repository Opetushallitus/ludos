import { BaseOut, TeachingLanguage } from '../../../../types'
import { InternalLink } from '../../../InternalLink'
import { StateTag } from '../../../StateTag'
import { Icon } from '../../../Icon'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { PdfTag } from '../../../PdfTag'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { muokkausKey } from '../../../LudosRoutes'
import { isLdCertificate, isPuhviCertificate, isSukoCertificate } from '../../../../utils/certificateUtils'
import { useKoodisto } from '../../../../hooks/useKoodisto'

type CertificateCardProps = {
  certificate: BaseOut
  teachingLanguage: TeachingLanguage
}

export const CertificateCard = ({ certificate, teachingLanguage }: CertificateCardProps) => {
  const { isYllapitaja } = useUserDetails()
  const { getKoodiLabel } = useKoodisto()

  const getCertificateName = () => {
    if (isSukoCertificate(certificate)) {
      return certificate.nameFi
    } else if (isLdCertificate(certificate)) {
      return getKoodiLabel(certificate.aineKoodiArvo, 'ludoslukiodiplomiaine')
    } else if (isPuhviCertificate(certificate)) {
      return teachingLanguage === 'fi' ? certificate.nameFi : certificate.nameSv
    }
    return null
  }

  const getCertificateDescription = () => {
    if (isSukoCertificate(certificate)) {
      return certificate.descriptionFi
    } else if (isLdCertificate(certificate)) {
      return teachingLanguage === 'fi' ? certificate.nameFi : certificate.nameSv
    } else if (isPuhviCertificate(certificate)) {
      return teachingLanguage === 'fi' ? certificate.nameFi : certificate.nameSv
    }
    return null
  }

  return (
    <div
      className="w-[17.5rem] rounded-md border border-t-4 border-gray-light border-t-green-primary flex flex-col"
      data-testid={`certificate-${certificate.id}`}>
      <div className="text-center flex-1 px-2 break-words">
        <InternalLink className="text-sm font-semibold text-green-primary" to={`${certificate.id}`}>
          {getCertificateName()}
        </InternalLink>
        {isYllapitaja && (
          <InternalLink
            className="p-0 ml-2"
            to={`${muokkausKey}/${certificate.id}`}
            data-testid={`certificate-${certificate.id}-edit`}>
            <Icon name="muokkaa" color="text-green-primary" />
          </InternalLink>
        )}
      </div>

      <p className="mb-2 mt-2 text-center text-xs">{getCertificateDescription()}</p>

      <div className="row mt-3 justify-between">
        <div className="w-20">{isYllapitaja && <StateTag state={certificate.publishState} />}</div>
        <p className="text-center text-xs">{toLocaleDate(certificate.createdAt)}</p>
        <PdfTag />
      </div>
    </div>
  )
}
