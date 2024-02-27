import {
  AttachmentDtoOut,
  ContentBaseOut,
  ContentType,
  Language,
  isLdCertificate,
  isPuhviCertificate,
  isSukoCertificate,
  LdCertificateDtoOut,
  PuhviCertificateDtoOut,
  SukoCertificateDtoOut
} from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../forms/formCommon/attachment/AttachmentFileDetailView'
import { useKoodisto } from '../../hooks/useKoodisto'
import { LudosContext } from '../../contexts/LudosContext'
import { useContext } from 'react'

type CertificateContentProps = {
  certificate: ContentBaseOut
  teachingLanguage: Language
}

const SukoCertificateTitle = ({
  certificate,
  labelText
}: {
  certificate: SukoCertificateDtoOut
  labelText: string
}) => (
  <>
    <h4 className="mt-6 font-semibold">{labelText}</h4>
    <p data-testid="certificate-description">{certificate.descriptionFi}</p>
  </>
)

const LdCertificateTitle = ({
  certificate,
  labelText,
  teachingLanguage
}: {
  certificate: LdCertificateDtoOut
  labelText: string
  teachingLanguage: Language
}) => {
  const { getKoodiLabel } = useKoodisto(teachingLanguage)

  return (
    <>
      <h4 className="mt-6 font-semibold">{labelText}</h4>
      <p data-testid="certificate-aine">{getKoodiLabel(certificate.aineKoodiArvo, 'ludoslukiodiplomiaine')}</p>
    </>
  )
}

const PuhviCertificateTitle = ({
  certificate,
  labelText
}: {
  certificate: PuhviCertificateDtoOut
  labelText: string
}) => {
  const { teachingLanguage } = useContext(LudosContext)

  return (
    <>
      <h4 className="mt-6 font-semibold">{labelText}</h4>
      <p data-testid="certificate-description">
        {teachingLanguage === 'FI' ? certificate.descriptionFi : certificate.descriptionSv}
      </p>
    </>
  )
}

const CertificateContentAttachmentView = ({ name, attachment }: { name: string; attachment: AttachmentDtoOut }) => {
  return (
    <AttachmentFileDetailView
      contentType={ContentType.CERTIFICATE}
      attachments={{
        name,
        attachment
      }}
      handleAttachmentNameChange={() => {}}
    />
  )
}

export const CertificateContent = ({ certificate, teachingLanguage }: CertificateContentProps) => {
  const { t } = useTranslation()

  const RenderCertificateCardTitle = () => {
    if (isSukoCertificate(certificate)) {
      return <SukoCertificateTitle certificate={certificate} labelText={t('certificate.kuvaus')} />
    } else if (isLdCertificate(certificate)) {
      return (
        <LdCertificateTitle
          certificate={certificate}
          labelText={t('assignment.aine')}
          teachingLanguage={teachingLanguage}
        />
      )
    } else if (isPuhviCertificate(certificate)) {
      return <PuhviCertificateTitle certificate={certificate} labelText={t('certificate.kuvaus')} />
    }
  }

  return (
    <div>
      <RenderCertificateCardTitle />
      <h4 className="mb-3 mt-8 font-semibold">{t('certificate.todistus')}</h4>
      {isSukoCertificate(certificate) ? (
        <CertificateContentAttachmentView name={certificate.attachmentFi.name} attachment={certificate.attachmentFi} />
      ) : (
        (isLdCertificate(certificate) || isPuhviCertificate(certificate)) && (
          <>
            {teachingLanguage === 'FI' ? (
              <CertificateContentAttachmentView
                name={certificate.attachmentFi.name}
                attachment={certificate.attachmentFi}
              />
            ) : certificate.attachmentSv ? (
              <CertificateContentAttachmentView
                name={certificate.attachmentSv.name}
                attachment={certificate.attachmentSv}
              />
            ) : (
              <span aria-label="no attachment">&#8208;</span>
            )}
          </>
        )
      )}
    </div>
  )
}
