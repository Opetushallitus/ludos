import { Icon } from '../Icon'
import { ExternalLink } from '../ExternalLink'
import { LOGOUT_URL } from '../../constants'
import { useTranslation } from 'react-i18next'

export const HeaderLogoutButton = () => {
  const { t } = useTranslation()
  return (
    <div className="row gap-2 items-center border-t border-gray-separator mt-2 px-4">
      <Icon name="logout" color="text-green-primary" size="lg" />
      <ExternalLink url={LOGOUT_URL} className="py-2" openInNewTab={false} data-testid="logout-button">
        {t('common.kirjaudu-ulos')}
      </ExternalLink>
    </div>
  )
}
