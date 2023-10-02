import { CertificateDtoOut, ContentType } from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../exam/formCommon/attachment/AttachmentFileDetailView'

type CertificateContentProps = {
  certificate: CertificateDtoOut
}

export const CertificateContent = ({ certificate }: CertificateContentProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mt-6 font-semibold">{t('certificate.nimi')}</h3>
      <p data-testid="certificate-name">{certificate.name}</p>
      <h3 className="mt-6 font-semibold">{t('certificate.kuvaus')}</h3>
      <p data-testid="certificate-description">{certificate.description}</p>
      <h3 className="mb-3 mt-8 font-semibold">{t('certificate.todistus')}</h3>
      <AttachmentFileDetailView
        contentType={ContentType.todistukset}
        attachments={{
          name: certificate.attachment.name,
          attachment: {
            ...certificate.attachment
          }
        }}
        handleAttachmentNameChange={() => {}}
      />
    </div>
  )
}
