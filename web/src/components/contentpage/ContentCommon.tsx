import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { BaseIn, ContentTypeEng } from '../../types'
import { getContentName } from '../exam/assignment/assignmentUtils'
import { toLocaleDate } from '../../formatUtils'
import { useConstantsWithLocalization } from '../../hooks/useConstantsWithLocalization'

type ContentHeaderProps = {
  language: string
  data: BaseIn
  onSelectedOptionsChange: (opt: string) => void
  contentType: string
}

export function ContentHeader({ onSelectedOptionsChange, data, language, contentType }: ContentHeaderProps) {
  const { t } = useTranslation()
  const { LANGUAGE_OPTIONS } = useConstantsWithLocalization()

  return (
    <div className="row mb-3 mt-5 flex-wrap items-center justify-between">
      <div className="flex w-2/3 flex-col">
        <div className="row my-1">
          <p>{toLocaleDate(data.createdAt)}</p>
        </div>
        <div className="row">
          <h2 className="w-full md:w-1/2" data-testid="assignment-header">
            {getContentName(data, contentType, language) || t('form.nimeton')}
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
  const { CONTENT_ACTIONS } = useConstantsWithLocalization()

  return (
    <div className="row mt-3 w-full flex-wrap gap-3">
      {CONTENT_ACTIONS.map((icon) => (
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
