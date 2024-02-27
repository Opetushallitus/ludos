import {
  ContentBaseOut,
  isLdCertificate,
  isPuhviCertificate,
  isSukoCertificate,
  TeachingLanguage
} from '../../../../types'
import { InternalLink } from '../../../InternalLink'
import { StateTag } from '../../../StateTag'
import { Icon } from '../../../Icon'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { PdfViewerLinkTag } from '../../../PdfViewerLinkTag'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { muokkausKey } from '../../../LudosRoutes'
import { useKoodisto } from '../../../../hooks/useKoodisto'

const getFileKey = (certificate: ContentBaseOut, language: TeachingLanguage) => {
  if (isSukoCertificate(certificate)) {
    return certificate.attachmentFi.fileKey
  } else if (isLdCertificate(certificate) || isPuhviCertificate(certificate)) {
    return language === 'FI' ? certificate.attachmentFi.fileKey : certificate.attachmentSv?.fileKey
  }
  return ''
}

type CertificateCardProps = {
  certificate: ContentBaseOut
  teachingLanguage: TeachingLanguage
}

export const CertificateCard = ({ certificate, teachingLanguage }: CertificateCardProps) => {
  const { isYllapitaja } = useUserDetails()
  const { getKoodiLabel } = useKoodisto(teachingLanguage)

  const getCertificateName = () => {
    if (isSukoCertificate(certificate)) {
      return certificate.nameFi
    } else if (isLdCertificate(certificate)) {
      return getKoodiLabel(certificate.aineKoodiArvo, 'ludoslukiodiplomiaine')
    } else if (isPuhviCertificate(certificate)) {
      return teachingLanguage === 'FI' ? certificate.nameFi : certificate.nameSv
    }
    return null
  }

  const getCertificateDescription = () => {
    if (isSukoCertificate(certificate)) {
      return certificate.descriptionFi
    } else if (isLdCertificate(certificate)) {
      return teachingLanguage === 'FI' ? certificate.nameFi : certificate.nameSv
    } else if (isPuhviCertificate(certificate)) {
      return teachingLanguage === 'FI' ? certificate.nameFi : certificate.nameSv
    }
    return null
  }

  const fileKey = getFileKey(certificate, teachingLanguage)

  return (
    <li
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

      <p className="mb-2 mt-2 text-center text-xs" data-testid="card-body">
        {getCertificateDescription()}
      </p>

      <div className="row mt-3 justify-between">
        {isYllapitaja && <StateTag state={certificate.publishState} />}
        <p className="text-center text-xs">{toLocaleDate(certificate.createdAt)}</p>
        {fileKey && <PdfViewerLinkTag fileKey={fileKey} />}
      </div>
    </li>
  )
}
