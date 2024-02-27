import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import { ContentBaseOut, ContentType, Exam, TeachingLanguage } from '../../types'
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
  teachingLanguage: TeachingLanguage
  data: ContentBaseOut
  contentType: ContentType
  isPresentation: boolean
}

export function ContentHeader({ data, teachingLanguage, contentType, isPresentation }: ContentHeaderProps) {
  // TODO: korvaa contentType data.contentType:llä
  const { t, lt } = useLudosTranslation()

  const shouldShowTeachingLanguageDropdown =
    contentType === ContentType.INSTRUCTION ||
    (contentType === ContentType.CERTIFICATE && data.exam !== Exam.SUKO) ||
    (contentType === ContentType.ASSIGNMENT && data.exam !== Exam.SUKO)

  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <div className="flex w-2/3 flex-col">
        {!isPresentation && (
          <div className="row my-1">
            <p>{toLocaleDate(data.createdAt)}</p>
          </div>
        )}
        <div className="row">
          <h2 className="w-full md:w-1/2" data-testid="assignment-header">
            {getContentName(data, teachingLanguage) || t('form.nimeton')}
          </h2>
        </div>
      </div>
      {shouldShowTeachingLanguageDropdown && (
        <div>
          <p>{lt.contentPageLanguageDropdownLabel[contentType]}</p>
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
  pdfData?: { baseOut: ContentBaseOut; language: TeachingLanguage; contentType: ContentType }
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

export function ContentInstruction({
  teachingLanguage,
  instructionFi,
  instructionSv
}: {
  teachingLanguage: TeachingLanguage
  instructionFi: string
  instructionSv: string
}) {
  return (
    <div className="mb-4 mt-3">
      <p className="text-sm font-semibold" key={teachingLanguage} data-testid={`instruction-${teachingLanguage}`}>
        {teachingLanguage === 'FI' ? instructionFi : instructionSv}
      </p>
    </div>
  )
}

const RenderContent = ({
  content,
  teachingLanguage
}: {
  content: string | string[]
  teachingLanguage: TeachingLanguage
}) =>
  Array.isArray(content) ? (
    content.map((it, i) => (
      <TipTap
        key={`${teachingLanguage}-${i}`}
        content={it}
        editable={false}
        dataTestId={`editor-content-${teachingLanguage}-${i}`}
      />
    ))
  ) : (
    <TipTap
      key={teachingLanguage}
      content={content}
      editable={false}
      dataTestId={`editor-content-${teachingLanguage}-0`}
    />
  )

// instructions content is not in array while assignments are always
export function ContentContent({
  teachingLanguage,
  contentFi,
  contentSv
}: {
  teachingLanguage: TeachingLanguage
  contentFi: string | string[]
  contentSv: string | string[]
}) {
  const content = teachingLanguage === 'FI' ? contentFi : contentSv

  return <RenderContent content={content} teachingLanguage={teachingLanguage} />
}
