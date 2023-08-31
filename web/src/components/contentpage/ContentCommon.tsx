import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { Icon } from '../Icon'
import { BaseIn, ContentTypeEng } from '../../types'
import { ContentTypeTranslationFinnish, getContentName } from '../exam/assignment/assignmentUtils'
import { toLocaleDate } from '../../formatUtils'
import { ContentAction, useConstantsWithLocalization } from '../../hooks/useConstantsWithLocalization'
import { TipTap } from '../exam/formCommon/editor/TipTap'
import { InternalLink } from '../InternalLink'

type ContentHeaderProps = {
  language: string
  data: BaseIn
  onSelectedOptionsChange: (opt: string) => void
  contentType: string
  isPresentation: boolean
}

export function ContentHeader({
  onSelectedOptionsChange,
  data,
  language,
  contentType,
  isPresentation
}: ContentHeaderProps) {
  const { t } = useTranslation()
  const { LANGUAGE_OPTIONS } = useConstantsWithLocalization()

  return (
    <div className="row mb-3 mt-5 flex-wrap items-center justify-between">
      <div className="flex w-2/3 flex-col">
        {!isPresentation && (
          <div className="row my-1">
            <p>{toLocaleDate(data.createdAt)}</p>
          </div>
        )}
        <div className="row">
          <h2 className="w-full md:w-1/2" data-testid="assignment-header">
            {getContentName(data, contentType, language) || t('form.nimeton')}
          </h2>
        </div>
      </div>
      {contentType !== ContentTypeEng.TODISTUKSET && (
        <div>
          <p>{t(`filter.${ContentTypeTranslationFinnish[contentType]}-kieli`)}</p>
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

function ContentActionButton({ contentAction: { iconName, text, link } }: { contentAction: ContentAction }) {
  const className = 'flex gap-1'
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" />
      <span className="text-green-primary">{text}</span>
    </>
  )
  if (link) {
    return <InternalLink to={link} target="_blank" className={className} children={children} />
  } else {
    return <span className={className} children={children} />
  }
}

export function ContentActionRow() {
  const { CONTENT_ACTIONS } = useConstantsWithLocalization()

  return (
    <div className="row mt-3 w-full flex-wrap gap-3">
      {CONTENT_ACTIONS.map((contentAction) => (
        <ContentActionButton contentAction={contentAction} key={contentAction.iconName} />
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
      <p className="text-sm font-semibold" key={language}>
        {language === 'fi' ? instructionFi : instructionSv}
      </p>
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
  return (
    <TipTap
      key={language}
      content={language === 'fi' ? contentFi : contentSv}
      editable={false}
      dataTestId={`editor-content-${language}`}
    />
  )
}
