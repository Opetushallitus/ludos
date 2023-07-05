import { CertificateIn } from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../exam/formCommon/AttachmentFileDetailView'

type CertificateContentProps = {
  certificate: CertificateIn
}
export const CertificateContent = ({ certificate }: CertificateContentProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mt-6 font-semibold">{t('certificate.nimi')}</h3>
      <p>{certificate.name}</p>
      <h3 className="mt-6 font-semibold">{t('certificate.kuvaus')}</h3>
      <p>{certificate.description}</p>
      <h3 className="mb-3 mt-8 font-semibold">{t('certificate.todistus')}</h3>
      <AttachmentFileDetailView currentAttachment={certificate.attachment} newAttachment={null} loading={false} />
    </div>
  )
}
