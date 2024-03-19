import { Icon } from '../Icon'
import { ExternalLink } from '../ExternalLink'
import { LOGOUT_URL } from '../../constants'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const HeaderLogoutButton = () => {
  const { t } = useLudosTranslation()
  return (
    <div className="row gap-2 items-center border-t border-gray-separator mt-2 px-4">
      <Icon name="logout" color="text-green-primary" size="lg" />
      <ExternalLink url={LOGOUT_URL} className="py-2" openInNewTab={false} data-testid="logout-button">
        {t('common.kirjaudu-ulos')}
      </ExternalLink>
    </div>
  )
}
