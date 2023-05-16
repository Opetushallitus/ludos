import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { LANGUAGE_OPTIONS } from '../../koodistoUtils'
import { Icon } from '../Icon'

export function ContentHeader({
  onSelectedOptionsChange,
  nameFi,
  nameSv,
  language
}: {
  language: string
  nameFi: string
  nameSv: string
  onSelectedOptionsChange: (opt: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="row justify-between">
      <h2 className="pb-3" data-testid="assignment-header">
        {language === 'fi' ? nameFi : nameSv}
      </h2>
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
    </div>
  )
}

export function ContentIconRow() {
  const { t } = useTranslation()
  return (
    <div className="mt-3 flex gap-3">
      <div className="flex gap-1">
        <Icon name="uusi-valilehti" color="text-green-primary" />
        <p className="text-green-primary">{t('assignment.katselunakyma')}</p>
      </div>
      <div className="flex gap-1">
        <Icon name="todistukset" color="text-green-primary" />
        <p className="text-green-primary">{t('assignment.lataapdf')}</p>
      </div>
      <div className="flex gap-1">
        <Icon name="lisää" color="text-green-primary" />
        <p className="text-green-primary">{t('assignment.lisaalatauskoriin')}</p>
      </div>
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
