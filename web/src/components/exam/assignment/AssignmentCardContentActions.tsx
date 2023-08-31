import { Icon } from '../../Icon'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../InternalLink'
import content from '../../contentpage/Content'
import { ContentAction, useConstantsWithLocalization } from '../../../hooks/useConstantsWithLocalization'

type ContentActionsProps = {
  contentId: number
}

function AssignmentCardContentActionButton({
  contentAction: { iconName, text, link },
  contentId
}: {
  contentId: number
  contentAction: ContentAction
}) {
  const className = 'flex items-center pr-3'
  const children = (
    <>
      <Icon name={iconName} color="text-green-primary" />
      <span className="ml-1 text-xs text-green-primary">{text}</span>
    </>
  )
  if (link) {
    return <InternalLink to={`${contentId}/${link}`} target="_blank" className={className} children={children} />
  } else {
    return <span className={className} children={children} />
  }
}

export const AssignmentCardContentActions = ({ contentId }: ContentActionsProps) => {
  const { CONTENT_ACTIONS } = useConstantsWithLocalization()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly md:w-4/12 md:justify-end">
      {CONTENT_ACTIONS.map((contentAction) => (
        <AssignmentCardContentActionButton
          contentId={contentId}
          contentAction={contentAction}
          key={contentAction.iconName}
        />
      ))}
    </div>
  )
}
