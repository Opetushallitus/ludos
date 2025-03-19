import { Icon } from '../Icon'
import { ContentBaseOut, ContentType, Exam, Language } from '../../types'
import { getContentName, isSukoKertomisTehtavaAndSpecificOppimaara } from '../../utils/assignmentUtils'
import { toLocaleDate } from '../../utils/formatUtils'
import { ContentAction, useLudosTranslation } from '../../hooks/useLudosTranslation'
import { TipTap } from '../forms/formCommon/editor/TipTap'
import { InternalLink } from '../InternalLink'
import { Button } from '../Button'
import { esitysnakymaKey, tulostusnakymaKey } from '../LudosRoutes'
import { TeachingLanguageSelect } from '../TeachingLanguageSelect'
import { lazy, ReactElement, Suspense, useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'

type ContentHeaderProps = {
  teachingLanguage: Language
  data: ContentBaseOut
  isPresentation: boolean
}

export function ContentHeader({ data, teachingLanguage, isPresentation }: ContentHeaderProps): ReactElement {

  if (isSukoKertomisTehtavaAndSpecificOppimaara(data)) {
    return ContentHeaderWithLanguageSelector({ data, teachingLanguage, isPresentation })
  }

  if (data.contentType === ContentType.INSTRUCTION) {
    return ContentHeaderWithLanguageSelector({ data, teachingLanguage, isPresentation })
  }

  if (data.contentType === ContentType.CERTIFICATE && data.exam !== Exam.SUKO) {
    return ContentHeaderWithLanguageSelector({ data, teachingLanguage, isPresentation })
  }

  if (data.contentType === ContentType.ASSIGNMENT && data.exam !== Exam.SUKO) {
    return ContentHeaderWithLanguageSelector({ data, teachingLanguage, isPresentation })
  }

  return ContentHeaderWithoutLanguageSelector({ data, teachingLanguage, isPresentation })
}

export function ContentHeaderWithLanguageSelector({ data, teachingLanguage, isPresentation }: ContentHeaderProps) {
  const { lt } = useLudosTranslation()

  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <AssignmentTitle
        data={data}
        teachingLanguage={teachingLanguage}
        isPresentation={isPresentation}
        createdAt={data.createdAt}
      />

      <div className="print:hidden">
        <p>{lt.contentPageLanguageDropdownLabel[data.contentType]}</p>
        <TeachingLanguageSelect exam={data.exam} />
      </div>
    </div>
  )
}

export function ContentHeaderWithoutLanguageSelector({ data, teachingLanguage, isPresentation }: ContentHeaderProps) {
  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <AssignmentTitle
        data={data}
        teachingLanguage={teachingLanguage}
        isPresentation={isPresentation}
        createdAt={data.createdAt}
      />
    </div>
  )
}

interface AssignmentTitleProps {
  data: ContentBaseOut
  teachingLanguage: Language
  createdAt: string | Date
  isPresentation: boolean
}

const AssignmentTitle = (props: AssignmentTitleProps) => {
  const { t } = useLudosTranslation()
  const { data, teachingLanguage, createdAt, isPresentation } = props

  return (
    <div className="flex flex-col">
      {!isPresentation && (
        <div className="row my-1">
          <p>{toLocaleDate(createdAt)}</p>
        </div>
      )}
      <div className="row">
        <h2 className="w-full break-normal" data-testid="assignment-header">
          {getContentName(data, teachingLanguage) || t('form.nimeton')}
        </h2>
      </div>
    </div>
  )
}

function ContentActionButton({
  contentAction: { actionName, iconName, text, link },
  disabled,
  onClickHandler
}: {
  contentAction: ContentAction
  disabled?: boolean
  onClickHandler?: (actionName: string) => void
}) {
  const className = 'flex gap-1 items-center'

  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" />
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
  const { t } = useLudosTranslation()
  const { features } = useContext(LudosContext)

  function getLinkKeyAndText(): { text: string, link: string } {
    if (features.tulostusnakyma) {
      return {
        text: t('assignment.tulostusnakyma'),
        link: tulostusnakymaKey
      }
    } else {
      return {
        text: t('assignment.katselunakyma'),
        link: esitysnakymaKey
      }
    }
  }

  return (
    <div data-testid="content-action-row" className="row mt-3 w-full flex-wrap gap-3">
      <ContentActionButton
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          ...getLinkKeyAndText()
        }}
        disabled={disabled}
        key="uusi-valilehti"
      />
      {pdfData && (
        <Suspense
          fallback={
            <Button variant="buttonGhost" customClass="p-0 flex items-center" disabled>
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
            iconName: isFavorite ? 'suosikki' : 'suosikki-border',
            text: isFavorite ? t('favorite.poista-suosikeista') : t('favorite.lisaa-suosikiksi')
          }}
          onClickHandler={onFavoriteClick}
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

const RenderContent = ({ content, customKey }: RenderContentProps) => {
  if (Array.isArray(content)) {
    return (
      <>
        {' '}
        {content.map((it, i) => (
          <TipTap key={`${customKey}-${i}`} content={it} editable={false} dataTestId={`${customKey}-${i}`} />
        ))}
      </>
    )
  }
  return <TipTap key={customKey} content={content} editable={false} dataTestId={`${customKey}-0`} />
}

type ContentContentProps = {
  teachingLanguage: Language
  content: string | string[]
}

export const ContentContent = ({ teachingLanguage, content }: ContentContentProps) => (
  <RenderContent content={content} customKey={`editor-content-${teachingLanguage}`} />
)
