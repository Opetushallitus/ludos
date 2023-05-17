import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { LANGUAGE_OPTIONS } from '../../koodistoUtils'
import { Icon, Icons } from '../Icon'

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
      <div className="hidden md:block">
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
