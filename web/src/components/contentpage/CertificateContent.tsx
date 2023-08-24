import { CertificateIn, ContentTypeEng } from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../exam/formCommon/attachment/AttachmentFileDetailView'

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
      <AttachmentFileDetailView
        contentType={ContentTypeEng.TODISTUKSET}
        attachments={{
          name: certificate.attachment.name,
          attachment: {
            name: certificate.attachment.name,
            fileKey: certificate.attachment.fileKey,
            fileName: certificate.attachment.fileName,
            language: certificate.attachment.language,
            fileUploadDate: certificate.attachment.fileUploadDate
          }
        }}
        handleAttachmentNameChange={() => {}}
      />
    </div>
  )
}
