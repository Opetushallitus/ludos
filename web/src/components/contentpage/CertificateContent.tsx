import { CertificateIn } from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentDetails } from '../exam/formCommon/attachment/AttachmentDetails'

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
      <div className="w-full md:w-3/4">
        <div className="grid grid-cols-11 gap-2">
          <p className="col-span-3 md:col-span-4">{t('file.nimi')}</p>
          <p className="col-span-2 md:col-span-2 md:block">{t('file.lisatty')}</p>
        </div>

        <div className="border-y border-gray-light" />
        <AttachmentDetails
          fileDetails={{
            fileUploadDate: certificate.attachment.fileUploadDate,
            name: certificate.attachment.name,
            fileKey: certificate.attachment.fileKey,
            fileName: certificate.attachment.fileName
          }}
        />
      </div>
    </div>
  )
}
