import { ContentType, Exam, LdCertificateDtoOut, SukoOrPuhviCertificateDtoOut } from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../forms/formCommon/attachment/AttachmentFileDetailView'
import { useKoodisto } from '../../hooks/useKoodisto'
import { isLdCertificate } from '../../utils/certificateUtils'

type CertificateContentProps = {
  exam: Exam
  certificate: SukoOrPuhviCertificateDtoOut | LdCertificateDtoOut
}

export const CertificateContent = ({ exam, certificate }: CertificateContentProps) => {
  const { t } = useTranslation()
  const { getKoodiLabel } = useKoodisto()

  return (
    <div>
      {isLdCertificate(certificate, exam) ? (
        <>
          <h4 className="mt-6 font-semibold">{t('certificate.aine')}</h4>
          <p data-testid="certificate-aine">{getKoodiLabel(certificate.aineKoodiArvo!, 'ludoslukiodiplomiaine')}</p>
        </>
      ) : (
        <>
          {/* todo: remove keys if no used code <h3 className="mt-6 font-semibold">{t('certificate.nimi')}</h3>*/}
          {/*<p data-testid="certificate-name">{certificate.name}</p>*/}
          <h4 className="mt-6 font-semibold">{t('certificate.kuvaus')}</h4>
          <p data-testid="certificate-description">{certificate.description}</p>
        </>
      )}
      <h4 className="mb-3 mt-8 font-semibold">{t('certificate.todistus')}</h4>
      <AttachmentFileDetailView
        contentType={ContentType.todistukset}
        attachments={{
          name: certificate.attachment.name,
          attachment: certificate.attachment
        }}
        handleAttachmentNameChange={() => {}}
      />
    </div>
  )
}
