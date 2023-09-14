import { Icon } from '../../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../InternalLink'
import { ContentAction } from '../../../hooks/useConstantsWithLocalization'
import { Button } from '../../Button'

type AssignmentCardContentActionButtonProps = {
  contentId: number
  contentAction: ContentAction
  isActive?: boolean
  onClickHandler?: () => void
}

function AssignmentCardContentActionButton({
  contentId,
  contentAction: { actionName, iconName, text, link },
  isActive,
  onClickHandler
}: AssignmentCardContentActionButtonProps) {
  const className = 'flex items-center pr-3'
  const testId = `assignment-${contentId}-action-${actionName}`
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" isActive={isActive} />
      <span className="ml-1 text-xs text-green-primary">{text}</span>
    </>
  )

  if (link) {
    return (
      <InternalLink
        to={`${contentId}/${link}`}
        target="_blank"
        className={className}
        children={children}
        testId={testId}
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

type AssignmentCardContentActionsProps = {
  contentId: number
  isFavorite?: boolean
  onClickHandler?: () => void
}

export const AssignmentCardContentActions = ({
  contentId,
  isFavorite,
  onClickHandler
}: AssignmentCardContentActionsProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly md:w-4/12 md:justify-end">
      <AssignmentCardContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'katselunakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.katselunakyma'),
          link: 'presentation'
        }}
        key="uusi-valilehti"
      />
      <AssignmentCardContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'lataa-pdf',
          iconName: 'pdf',
          text: t('assignment.lataapdf')
        }}
        key="pdf"
      />
      <AssignmentCardContentActionButton
        contentId={contentId}
        contentAction={{
          actionName: 'suosikki',
          iconName: 'suosikki',
          text: isFavorite ? 'Poista suosikeista' : 'Lisää suosikiksi'
        }}
        onClickHandler={onClickHandler}
        isActive={isFavorite}
        key="suosikki"
      />
    </div>
  )
}
