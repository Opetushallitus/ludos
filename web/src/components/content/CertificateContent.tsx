import {
  AttachmentDtoOut,
  BaseOut,
  ContentType,
  LdCertificateDtoOut,
  PuhviCertificateDtoOut,
  SukoCertificateDtoOut,
  TeachingLanguage
} from '../../types'
import { useTranslation } from 'react-i18next'
import { AttachmentFileDetailView } from '../forms/formCommon/attachment/AttachmentFileDetailView'
import { useKoodisto } from '../../hooks/useKoodisto'
import { isLdCertificate, isPuhviCertificate, isSukoCertificate } from '../../utils/certificateUtils'
import { LudosContext } from '../../contexts/LudosContext'
import { useContext } from 'react'

type CertificateContentProps = {
  certificate: BaseOut
  teachingLanguage: TeachingLanguage
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

const LdCertificateTitle = ({ certificate, labelText }: { certificate: LdCertificateDtoOut; labelText: string }) => {
  const { getKoodiLabel } = useKoodisto()

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
        {teachingLanguage === 'fi' ? certificate.descriptionFi : certificate.descriptionSv}
      </p>
    </>
  )
}

const CertificateContentAttachmentView = ({ name, attachment }: { name: string; attachment: AttachmentDtoOut }) => {
  return (
    <AttachmentFileDetailView
      contentType={ContentType.todistukset}
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
      return <LdCertificateTitle certificate={certificate} labelText={t('assignment.aine')} />
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
          <CertificateContentAttachmentView
            name={teachingLanguage === 'fi' ? certificate.attachmentFi.name : certificate.attachmentSv.name}
            attachment={teachingLanguage === 'fi' ? certificate.attachmentFi : certificate.attachmentSv}
          />
        )
      )}
    </div>
  )
}
