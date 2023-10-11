import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import { BaseOut, ContentType, Exam } from '../../types'
import { getContentName } from '../exam/assignment/assignmentUtils'
import { toLocaleDate } from '../../formatUtils'
import { ContentAction, useLudosTranslation } from '../../hooks/useLudosTranslation'
import { TipTap } from '../exam/formCommon/editor/TipTap'
import { InternalLink } from '../InternalLink'
import { Button } from '../Button'
import { esitysnakymaKey } from '../routes/LudosRoutes'
import { SingleValue } from 'react-select'
import { LudosSelect, LudosSelectOption } from '../ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../ludosSelect/helpers'
import { sortKooditByArvo } from '../../hooks/useKoodisto'

type ContentHeaderProps = {
  language: string
  data: BaseOut
  onSelectedOptionsChange: (opt: SingleValue<LudosSelectOption>) => void
  contentType: ContentType
  isPresentation: boolean
}

export function ContentHeader({
  onSelectedOptionsChange,
  data,
  language,
  contentType,
  isPresentation
}: ContentHeaderProps) {
  const { LANGUAGE_OPTIONS, t } = useLudosTranslation()

  const shouldShowTeachingLanguageDropdown =
    contentType === ContentType.ohjeet || (contentType === ContentType.koetehtavat && data.exam !== Exam.SUKO)

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
      {shouldShowTeachingLanguageDropdown && (
        <div>
          <p>{contentType === ContentType.koetehtavat ? t('filter.koetehtavat-kieli') : t('filter.ohjeet-kieli')}</p>
          <LudosSelect
            name="languageDropdown"
            options={koodistoSelectOptions(sortKooditByArvo(LANGUAGE_OPTIONS))}
            value={currentKoodistoSelectOption(language, LANGUAGE_OPTIONS)}
            onChange={(opt) => onSelectedOptionsChange(opt)}
          />
        </div>
      )}
    </div>
  )
}

function ContentActionButton({
  contentId,
  contentAction: { actionName, iconName, text, link },
  isActive,
  onClickHandler
}: {
  contentId: number
  contentAction: ContentAction
  isActive?: boolean
  onClickHandler?: () => void
}) {
  const className = 'flex gap-1 items-center'
  const testId = `assignment-action-${actionName}`
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" isActive={isActive} />
      <span className="ml-1 text-xs text-green-primary">{text}</span>
    </>
  )
  if (link) {
    return (
      <InternalLink
        to={`${link}`}
        target="_blank"
        className={`${className} hover:bg-gray-active`}
        children={children}
        data-testid={testId}
      />
    )
  } else {
    return (
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={onClickHandler}
        data-testid={`assignment-${contentId.toString()}-${iconName}`}>
        {children}
      </Button>
    )
  }
}

export function ContentActionRow({
  contentId,
  isFavorite,
  onClickHandler
}: {
  contentId: number
  isFavorite?: boolean
  onClickHandler?: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="row mt-3 w-full flex-wrap gap-3">
      <ContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.katselunakyma'),
          link: esitysnakymaKey
        }}
        key="uusi-valilehti"
      />
      <ContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'lataa-pdf',
          iconName: 'pdf',
          text: t('assignment.lataapdf')
        }}
        key="pdf"
      />
      {isFavorite !== undefined && (
        <ContentActionButton
          contentId={contentId}
          contentAction={{
            actionName: 'suosikki',
            iconName: 'suosikki',
            text: isFavorite ? t('favorite.poista-suosikeista') : t('favorite.lisaa-suosikiksi')
          }}
          onClickHandler={onClickHandler}
          isActive={isFavorite}
          key="suosikki"
        />
      )}
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
      <p className="text-sm font-semibold" key={language} data-testid={`instruction-${language}`}>
        {language === 'fi' ? instructionFi : instructionSv}
      </p>
    </div>
  )
}

const RenderContent = ({ content, language }: { content: string | string[]; language: string }) =>
  Array.isArray(content) ? (
    content.map((it, i) => (
      <TipTap key={`${language}-${i}`} content={it} editable={false} dataTestId={`editor-content-${language}-${i}`} />
    ))
  ) : (
    <TipTap key={language} content={content} editable={false} dataTestId={`editor-content-${language}-0`} />
  )

// instructions content is not in array while assignments are always
export function ContentContent({
  language,
  contentFi,
  contentSv
}: {
  language: string
  contentFi: string | string[]
  contentSv: string | string[]
}) {
  const content = language === 'fi' ? contentFi : contentSv

  return <RenderContent content={content} language={language} />
}
