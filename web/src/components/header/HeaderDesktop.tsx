import { HeaderDropdown } from './HeaderDropdown'
import { LOGOUT_URL, virkailijanOpintopolkuUrl } from '../../constants'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useContext, useState } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { HeaderFavorites } from './HeaderFavorites'
import { InternalNavLink } from '../InternalNavLink'
import { HeaderPage } from './Header'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { useDropdownCloseOnBlur } from '../../hooks/useDropdownCloseOnBlur'
import { ExternalLink } from '../ExternalLink'

type HeaderDesktopProps = {
  pages: HeaderPage[]
}

export const HeaderDesktop = ({ pages }: HeaderDesktopProps) => {
  const { LANGUAGE_DROPDOWN, t } = useLudosTranslation()
  const { isYllapitaja } = useUserDetails()
  const { userFavoriteAssignmentCount, uiLanguage, setUiLanguage } = useContext(LudosContext)
  const [showMenu, setShowMenu] = useState(false)
  const showMenuRef = useDropdownCloseOnBlur<boolean>(false, setShowMenu)

  const { firstNames, lastName, role } = useUserDetails()

  // filter out keys option if not YLLAPITAJA
  const { keys, ...languageDropdownOptionsWithoutShowKeys } = LANGUAGE_DROPDOWN
  const languageDropdownOptions = isYllapitaja ? LANGUAGE_DROPDOWN : languageDropdownOptionsWithoutShowKeys

  return (
    <div className="flex justify-center bg-gray-bg">
      <div className="w-[80vw]">
        <div className="row justify-between pt-3">
          <h1>{t('title.ludos')}</h1>
          <div className="flex h-6 flex-row gap-4">
            <div className="relative" ref={showMenuRef}>
              <Button
                className="flex items-center text-green-primary"
                data-testid="user-menu-expand"
                onClick={() => setShowMenu(!showMenu)}
                variant="buttonGhost">
                {`${firstNames} ${lastName}`}
                <Icon name="laajenna" color="text-black" size="lg" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-max pr-3 rounded border border-gray-border bg-white">
                  <div className="pl-4 py-2" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <p className="font-semibold">{t('header.vaihda-sovellusta')}</p>
                  </div>
                  <div className="row gap-2 items-center pl-4" role="menuitem">
                    <span className="flex items-center w-4">
                      <Icon name="check" size="lg" color="text-black" />
                    </span>
                    <p>{t('title.ludos')}</p>
                  </div>
                  <div className="row gap-2 items-center pl-4" role="menuitem">
                    <span className="w-4" />
                    <ExternalLink
                      url={virkailijanOpintopolkuUrl()}
                      className="py-2"
                      openInNewTab={false}
                      data-testid="footer-virkailijan-opintopolku-link">
                      {t('common.virkailijan-opintopolku')}
                    </ExternalLink>
                  </div>
                  <div className="row gap-2 items-center border-t border-gray-separator mt-2 px-4">
                    <Icon name="logout" color="text-green-primary" size="lg" />
                    <ExternalLink url={LOGOUT_URL} className="py-2" openInNewTab={false} data-testid="logout-button">
                      {t('common.kirjaudu-ulos')}
                    </ExternalLink>
                  </div>
                </div>
              )}
              <p className="text-xss" data-testid="header-user-role">
                {role}
              </p>
            </div>

            <HeaderFavorites userFavoriteAssignmentCount={userFavoriteAssignmentCount} />

            <div className="relative border-l border-green-primary pl-5">
              <HeaderDropdown
                currentOption={languageDropdownOptions[uiLanguage].name}
                options={languageDropdownOptions}
                onOptionClick={setUiLanguage}
                testId="header-language-dropdown"
              />
            </div>
          </div>
        </div>
        <nav className="row pb-1 pt-3">
          <ul className="row gap-6 whitespace-nowrap">
            {pages.map(({ path, key, localizationText, navigateTo }, i) => (
              <li key={i}>
                <InternalNavLink
                  to={path}
                  navigateTo={navigateTo}
                  className={({ isActive }) =>
                    `p-1 text-lg text-gray-primary hover:bg-gray-light${
                      isActive ? ' border-b-5 border-b-green-primary text-green-primary' : ''
                    }`
                  }
                  data-testid={`nav-link-${key}`}>
                  {localizationText}
                </InternalNavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
