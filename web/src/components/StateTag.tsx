import { useTranslation } from 'react-i18next'
import { PublishState } from '../types'

type TagAttributes = {
  localizationKey: string
  variant: string
}

function getTagAttributes(state: PublishState): TagAttributes {
  switch (state) {
    case PublishState.Draft:
      return { localizationKey: 'state.luonnos', variant: 'bg-yellow' }
    case PublishState.Published:
      return { localizationKey: 'state.julkaistu', variant: 'bg-green-light' }
    case PublishState.Archived:
      return { localizationKey: 'state.arkistoitu', variant: 'bg-gray-secondary' }
  }
}

export const StateTag = ({ state }: { state: PublishState }) => {
  const { t } = useTranslation()
  const tagAttributes = getTagAttributes(state)

  return (
    <div className={`w-20 rounded-sm ${tagAttributes.variant} text-center text-xs`} data-testid="publish-state">
      {t(`${tagAttributes.localizationKey}`)}
    </div>
  )
}
