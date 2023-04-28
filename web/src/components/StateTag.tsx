import { useTranslation } from 'react-i18next'
import { AssignmentState } from '../types'

type TagAttributes = {
  text: string
  variant: string
}

function getTagAttributes(state: AssignmentState): TagAttributes {
  switch (state) {
    case AssignmentState.Draft:
      return { text: 'luonnos', variant: 'bg-yellow' }
    case AssignmentState.Published:
      return { text: 'julkaistu', variant: 'bg-green-light' }
    case AssignmentState.Archived:
      return { text: 'arkistoitu', variant: 'bg-gray-secondary' }
  }
}

export const StateTag = ({ state }: { state: AssignmentState }) => {
  const { t } = useTranslation()
  const tagAttributes = getTagAttributes(state)

  return (
    <div className={`w-20 rounded ${tagAttributes.variant} text-center text-xs`}>
      {t(`state.${tagAttributes.text}`)}
    </div>
  )
}
