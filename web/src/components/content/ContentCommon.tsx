import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import { ContentBaseOut, ContentType, Exam, Language } from '../../types'
import { getContentName } from '../../utils/assignmentUtils'
import { toLocaleDate } from '../../utils/formatUtils'
import { ContentAction, useLudosTranslation } from '../../hooks/useLudosTranslation'
import { TipTap } from '../forms/formCommon/editor/TipTap'
import { InternalLink } from '../InternalLink'
import { Button } from '../Button'
import { esitysnakymaKey } from '../LudosRoutes'
import { TeachingLanguageSelect } from '../TeachingLanguageSelect'
import { lazy, Suspense } from 'react'

type ContentHeaderProps = {
  teachingLanguage: Language
  data: ContentBaseOut
  isPresentation: boolean
}

export function ContentHeader({ data, teachingLanguage, isPresentation }: ContentHeaderProps) {
  const { t, lt } = useLudosTranslation()

  const shouldShowTeachingLanguageDropdown =
    data.contentType === ContentType.INSTRUCTION ||
    (data.contentType === ContentType.CERTIFICATE && data.exam !== Exam.SUKO) ||
    (data.contentType === ContentType.ASSIGNMENT && data.exam !== Exam.SUKO)

  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <div className="flex flex-col">
        {!isPresentation && (
          <div className="row my-1">
            <p>{toLocaleDate(data.createdAt)}</p>
          </div>
        )}
        <div className="row">
          <h2 className="w-full break-normal" data-testid="assignment-header">
            {getContentName(data, teachingLanguage) || t('form.nimeton')}
          </h2>
        </div>
      </div>
      {shouldShowTeachingLanguageDropdown && (
        <div>
          <p>{lt.contentPageLanguageDropdownLabel[data.contentType]}</p>
          <TeachingLanguageSelect />
        </div>
      )}
    </div>
  )
}

function ContentActionButton({
  contentAction: { actionName, iconName, text, link },
  isActive,
  disabled,
  onClickHandler
}: {
  contentAction: ContentAction
  isActive?: boolean
  disabled?: boolean
  onClickHandler?: (actionName: string) => void
}) {
  const className = 'flex gap-1 items-center'

  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" filled={isActive} />
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
        disabled={disabled}
        data-testid={actionName}
      />
    )
  } else {
    return (
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center pr-3"
        onClick={() => onClickHandler?.(actionName)}
        disabled={disabled}
        data-testid={actionName}>
        {children}
      </Button>
    )
  }
}

const PDFDownloadButton = lazy(() => import('./pdf/PdfDownloadButton'))

type ContentActionRowProps = {
  isFavorite?: boolean
  disabled?: boolean
  onFavoriteClick?: () => void
  pdfData?: { baseOut: ContentBaseOut; language: Language; contentType: ContentType }
}

export function ContentActionRow({ isFavorite, disabled, onFavoriteClick, pdfData }: ContentActionRowProps) {
  const { t } = useTranslation()

  return (
    <div className="row mt-3 w-full flex-wrap gap-3">
      <ContentActionButton
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.katselunakyma'),
          link: esitysnakymaKey
        }}
        disabled={disabled}
        key="uusi-valilehti"
      />
      {pdfData && (
        <Suspense
          fallback={
            <Button variant="buttonGhost" customClass="p-0 flex items-center pr-3" disabled>
              <Icon name="pdf" color="text-green-primary" />
              <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
            </Button>
          }>
          <PDFDownloadButton exam={pdfData.baseOut.exam} contentId={pdfData.baseOut.id} language={pdfData.language} />
        </Suspense>
      )}
      {isFavorite !== undefined && (
        <ContentActionButton
          contentAction={{
            actionName: 'suosikki',
            iconName: 'suosikki',
            text: isFavorite ? t('favorite.muokkaa-suosikkeja') : t('favorite.lisaa-suosikiksi')
          }}
          onClickHandler={onFavoriteClick}
          isActive={isFavorite}
          disabled={disabled}
          key="suosikki"
        />
      )}
    </div>
  )
}

type ContentInstructionProps = {
  teachingLanguage: Language
  content: string
}

export const ContentInstruction = ({ teachingLanguage, content }: ContentInstructionProps) => (
  <RenderContent content={content} customKey={`editor-instruction-${teachingLanguage}`} />
)

type RenderContentProps = {
  content: string | string[]
  customKey: string
}

const RenderContent = ({ content, customKey }: RenderContentProps) =>
  Array.isArray(content) ? (
    content.map((it, i) => (
      <TipTap key={`${customKey}-${i}`} content={it} editable={false} dataTestId={`${customKey}-${i}`} />
    ))
  ) : (
    <TipTap key={customKey} content={content} editable={false} dataTestId={`${customKey}-0`} />
  )

type ContentContentProps = {
  teachingLanguage: Language
  content: string | string[]
}

export const ContentContent = ({ teachingLanguage, content }: ContentContentProps) => (
  <RenderContent content={content} customKey={`editor-content-${teachingLanguage}`} />
)
