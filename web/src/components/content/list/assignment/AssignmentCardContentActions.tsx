import { ContentAction, useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { AssignmentCardOut, ContentTypePluralFi } from '../../../../types'
import { Button } from '../../../Button'
import { Icon } from '../../../Icon'
import { InternalLink } from '../../../InternalLink'
import { tulostusnakymaKey } from '../../../LudosRoutes'

type AssignmentCardContentActionButtonProps = {
  assignment: AssignmentCardOut
  contentAction: ContentAction
  onClickHandler?: () => void
  isDisabled?: boolean
}

function AssignmentCardContentActionButton({
  assignment: { id: contentId, exam },
  contentAction: { actionName, iconName, text, link },
  onClickHandler,
  isDisabled
}: AssignmentCardContentActionButtonProps) {
  const className = 'flex items-center'
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" />
      <span className="ml-1 text-xs text-green-primary">{text}</span>
    </>
  )

  if (link) {
    return (
      <InternalLink
        to={`/${exam}/${ContentTypePluralFi.ASSIGNMENT}/${contentId}/${link}`}
        target="_blank"
        className={className}
        children={children}
        disabled={isDisabled}
        data-testid={actionName}
      />
    )
  } else {
    return (
      <Button
        variant="buttonGhost"
        customClass="p-0 flex items-center"
        onClick={onClickHandler}
        disabled={isDisabled}
        data-testid={actionName}
      >
        {children}
      </Button>
    )
  }
}

type FavoriteActionProps = {
  isFavorite: boolean
  onClick: () => void
  isDisabled: boolean
}

type MoveFolderActionProps = {
  onClick: () => void
  hasFolders: boolean
}

type AssignmentCardContentActionsProps = {
  assignment: AssignmentCardOut
  favoriteAction: FavoriteActionProps
  moveFolderAction?: MoveFolderActionProps
}

export const AssignmentCardContentActions = ({
  assignment,
  favoriteAction,
  moveFolderAction
}: AssignmentCardContentActionsProps) => {
  const { t } = useLudosTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly gap-3 pr-2 md:w-5/12 md:justify-end">
      <AssignmentCardContentActionButton
        assignment={assignment}
        contentAction={{
          actionName: 'esitysnakyma',
          iconName: 'uusi-valilehti',
          text: t('assignment.tulostusnakyma'),
          link: tulostusnakymaKey
        }}
        key="uusi-valilehti"
      />
      <AssignmentCardContentActionButton
        assignment={assignment}
        contentAction={{
          actionName: 'suosikki',
          iconName: favoriteAction.isFavorite ? 'suosikki' : 'suosikki-border',
          text: favoriteAction.isFavorite ? t('favorite.poista-suosikeista') : t('favorite.lisaa-suosikiksi')
        }}
        onClickHandler={favoriteAction.onClick}
        isDisabled={favoriteAction.isDisabled}
        key="suosikki"
      />
      {moveFolderAction && (
        <AssignmentCardContentActionButton
          assignment={assignment}
          contentAction={{
            actionName: 'folder',
            iconName: 'kansio',
            text: t('favorite.siirra-kansioon')
          }}
          onClickHandler={moveFolderAction.onClick}
          isDisabled={!moveFolderAction.hasFolders}
          key="folder"
        />
      )}
    </div>
  )
}
