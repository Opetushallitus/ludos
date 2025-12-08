import { ReactElement } from 'react'
import logo from '../../../assets/oph_fin_vaaka.png'
import { ContentAction, useLudosTranslation } from '../../hooks/useLudosTranslation'
import { ContentBaseOut, ContentType, Exam, Language } from '../../types'
import { getContentName, isSukoKertomisTehtavaAndSpecificOppimaara } from '../../utils/assignmentUtils'
import { toLocaleDate } from '../../utils/formatUtils'
import { Button } from '../Button'
import { TipTap } from '../forms/formCommon/editor/TipTap'
import { Icon } from '../Icon'
import { InternalLink } from '../InternalLink'
import { tulostusnakymaKey } from '../LudosRoutes'
import { TeachingLanguageSelect } from '../TeachingLanguageSelect'

type ContentHeaderProps = {
  teachingLanguage: Language
  data: ContentBaseOut & { displayOphLogo?: boolean }
  lt: ReturnType<typeof useLudosTranslation>['lt']
  showQRCodesCheckbox?: boolean
  showQRCodes?: boolean
  onToggleQRCodes?: () => void
}

export function ContentHeader({
  data,
  teachingLanguage,
  showQRCodesCheckbox,
  showQRCodes,
  onToggleQRCodes
}: ContentHeaderProps): ReactElement {
  const { lt } = useLudosTranslation()

  if (isSukoKertomisTehtavaAndSpecificOppimaara(data)) {
    return ContentHeaderWithLanguageSelector({
      data,
      teachingLanguage,
      lt,
      showQRCodesCheckbox,
      showQRCodes,
      onToggleQRCodes
    })
  }

  if (data.contentType === ContentType.INSTRUCTION) {
    return ContentHeaderWithLanguageSelector({
      data,
      teachingLanguage,
      lt,
      showQRCodesCheckbox,
      showQRCodes,
      onToggleQRCodes
    })
  }

  if (data.contentType === ContentType.CERTIFICATE && data.exam !== Exam.SUKO) {
    return ContentHeaderWithLanguageSelector({
      data,
      teachingLanguage,
      lt,
      showQRCodesCheckbox,
      showQRCodes,
      onToggleQRCodes
    })
  }

  if (data.contentType === ContentType.ASSIGNMENT && data.exam !== Exam.SUKO) {
    return ContentHeaderWithLanguageSelector({
      data,
      teachingLanguage,
      lt,
      showQRCodesCheckbox,
      showQRCodes,
      onToggleQRCodes
    })
  }

  return ContentHeaderWithoutLanguageSelector({ data, teachingLanguage, lt })
}

export function ContentHeaderWithLanguageSelector({
  data,
  teachingLanguage,
  lt,
  showQRCodesCheckbox,
  showQRCodes,
  onToggleQRCodes
}: ContentHeaderProps) {
  const { t } = useLudosTranslation()

  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <AssignmentTitle data={data} teachingLanguage={teachingLanguage} createdAt={data.createdAt} />

      <div className="print:hidden flex items-end gap-4">
        <div>
          <p>{lt.contentPageLanguageDropdownLabel[data.contentType]}</p>
          <TeachingLanguageSelect exam={data.exam} />
        </div>

        {showQRCodesCheckbox && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={showQRCodes}
                onChange={onToggleQRCodes}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">{lt.contentPageQrCodeCheckboxLabel}</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

export function ContentHeaderWithoutLanguageSelector({ data, teachingLanguage }: ContentHeaderProps) {
  return (
    <div data-testid="content-common" className="row mb-3 flex-wrap items-center justify-between">
      <AssignmentTitle data={data} teachingLanguage={teachingLanguage} createdAt={data.createdAt} />
    </div>
  )
}

interface AssignmentTitleProps {
  data: ContentHeaderProps['data']
  teachingLanguage: Language
  createdAt: string | Date
}

const AssignmentTitle = (props: AssignmentTitleProps) => {
  const { t } = useLudosTranslation()
  const { data, teachingLanguage, createdAt } = props
  const { displayOphLogo } = data

  const Logo = displayOphLogo ? <img className="h-12 ml-auto mr-4" src={logo} alt="Opetushallituksen logo" /> : <></>

  return (
    <div className="flex flex-col w-full">
      <div className="row my-1 create-date">
        <p>{toLocaleDate(createdAt)}</p>
      </div>

      <div className="row items-center gap-2">
        <h2 className="w-full break-normal" data-testid="assignment-header">
          {getContentName(data, teachingLanguage) || t('form.nimeton')}
        </h2>
        {Logo}
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
        data-testid={actionName}
      >
        {children}
      </Button>
    )
  }
}

type ContentActionRowProps = {
  isFavorite?: boolean
  disabled?: boolean
  onFavoriteClick?: () => void
}

export function ContentActionRow({ isFavorite, disabled, onFavoriteClick }: ContentActionRowProps) {
  const { t } = useLudosTranslation()

  return (
    <div data-testid="content-action-row" className="row mt-3 w-full flex-wrap gap-3">
      <ContentActionButton
        contentAction={{
          iconName: 'uusi-valilehti',
          actionName: 'tulostusnakyma',
          text: t('assignment.tulostusnakyma'),
          link: tulostusnakymaKey
        }}
        disabled={disabled}
        key="uusi-valilehti"
      />
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
