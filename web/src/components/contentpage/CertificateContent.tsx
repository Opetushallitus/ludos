import { CertificateIn } from '../../types'
import { useTranslation } from 'react-i18next'
import { FileUploaded } from '../exam/assignment/form/formCommon/FileUploaded'

type CertificateContentProps = {
  certificate: CertificateIn
}
export const CertificateContent = ({ certificate }: CertificateContentProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mt-6 font-semibold">{t('certificate.nimi')}</h3>
      <p>{certificate.nameFi}</p>
      <h3 className="mt-6 font-semibold">{t('certificate.kuvaus')}</h3>
      <p>{certificate.contentFi}</p>
      <h3 className="mb-3 mt-8 font-semibold">{t('certificate.todistus')}</h3>
      <FileUploaded
        file={{
          fileName: certificate.fileName,
          fileKey: certificate.fileKey,
          fileUploadDate: certificate.fileUploadDate
        }}
      />
    </div>
  )
}
