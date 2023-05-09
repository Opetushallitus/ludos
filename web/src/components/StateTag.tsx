import { useTranslation } from 'react-i18next'
import { PublishState } from '../types'

type TagAttributes = {
  text: string
  variant: string
}

function getTagAttributes(state: PublishState): TagAttributes {
  switch (state) {
    case PublishState.Draft:
      return { text: 'luonnos', variant: 'bg-yellow' }
    case PublishState.Published:
      return { text: 'julkaistu', variant: 'bg-green-light' }
    case PublishState.Archived:
      return { text: 'arkistoitu', variant: 'bg-gray-secondary' }
  }
}

export const StateTag = ({ state }: { state: PublishState }) => {
  const { t } = useTranslation()
  const tagAttributes = getTagAttributes(state)

  return (
    <div className={`w-20 rounded ${tagAttributes.variant} text-center text-xs`}>
      {t(`state.${tagAttributes.text}`)}
    </div>
  )
}
