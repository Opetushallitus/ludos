import { Icon } from '../../../Icon'
import { InternalLink } from '../../../InternalLink'
import { ContentAction, useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { Button } from '../../../Button'
import { esitysnakymaKey } from '../../../LudosRoutes'
import { AssignmentCardOut, ContentTypePluralFi, Language } from '../../../../types'
import { lazy, Suspense } from 'react'

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
        data-testid={actionName}>
        {children}
      </Button>
    )
  }
}

const PdfDownloadButton = lazy(() => import('../../pdf/PdfDownloadButton'))

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
  language: Language
  favoriteAction: FavoriteActionProps
  moveFolderAction?: MoveFolderActionProps
}

export const AssignmentCardContentActions = ({
  assignment,
  language,
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
          text: t('assignment.katselunakyma'),
          link: esitysnakymaKey
        }}
        key="uusi-valilehti"
      />
      <Suspense
        fallback={
          <Button variant="buttonGhost" customClass="p-0 flex items-center pr-3" disabled>
            <Icon name="pdf" color="text-green-primary" />
            <span className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</span>
          </Button>
        }>
        <PdfDownloadButton exam={assignment.exam} contentId={assignment.id} language={language} />
      </Suspense>
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
