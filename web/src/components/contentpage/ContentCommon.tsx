import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { LANGUAGE_OPTIONS } from '../../koodistoUtils'
import { Icon, Icons } from '../Icon'
import { CertificateIn, ContentTypeEng } from '../../types'
import { FileUploaded } from '../exam/assignment/form/formCommon/FileUploaded'

type ContentHeaderProps = {
  language: string
  nameFi: string
  nameSv: string
  onSelectedOptionsChange: (opt: string) => void
  contentType?: string
}

export function ContentHeader({ onSelectedOptionsChange, nameFi, nameSv, language, contentType }: ContentHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="row mb-3 mt-5 flex-wrap items-center justify-between">
      <div className="flex w-2/3 flex-col">
        <div className="row my-1">
          <p>{new Date().toLocaleDateString('fi-FI')}</p>
        </div>
        <div className="row">
          <h2 className="w-full md:w-1/2" data-testid="assignment-header">
            {language === 'fi' ? nameFi : nameSv}
          </h2>
        </div>
      </div>
      {contentType !== ContentTypeEng.TODISTUKSET && (
        <div>
          <p className="pl-2">{t('assignment.kieli')}</p>
          <Dropdown
            id="languageDropdown"
            options={LANGUAGE_OPTIONS}
            selectedOption={LANGUAGE_OPTIONS.find((opt) => opt.koodiArvo === language)}
            onSelectedOptionsChange={onSelectedOptionsChange}
            testId={'language-dropdown'}
          />
        </div>
      )}
    </div>
  )
}

export function ContentIconRow() {
  const { t } = useTranslation()

  const icons: { name: Icons; text: string }[] = [
    {
      name: 'uusi-valilehti',
      text: t('assignment.katselunakyma')
    },
    {
      name: 'todistukset',
      text: t('assignment.lataapdf')
    },
    {
      name: 'lisää',
      text: t('assignment.lisaalatauskoriin')
    }
  ]

  return (
    <div className="row mt-3 w-full flex-wrap gap-3">
      {icons.map((icon) => (
        <div className="flex gap-1" key={icon.name}>
          <Icon name={icon.name} color="text-green-primary" />
          <p className="text-green-primary">{icon.text}</p>
        </div>
      ))}
    </div>
  )
}

export function ContentInstruction({
  language,
  instructionFi,
  instructionSv
}: {
  language: string
  instructionFi: string
  instructionSv: string
}) {
  return (
    <div className="mb-4 mt-3">
      <p className="text-sm font-semibold">{language === 'fi' ? instructionFi : instructionSv}</p>
    </div>
  )
}

export function ContentContent({
  language,
  contentFi,
  contentSv
}: {
  language: string
  contentFi: string
  contentSv: string
}) {
  return <p className="h-full pb-3 text-sm">{language === 'fi' ? contentFi : contentSv}</p>
}

export function CertificateContent({ certificate }: { certificate: CertificateIn }) {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mt-8 font-semibold">{t('certificate.nimi')}</h3>
      <p>{certificate.nameFi}</p>
      <h3 className="mt-8 font-semibold">{t('certificate.kuvaus')}</h3>
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
