import { HeaderDropdown } from './HeaderDropdown'
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
import { HeaderApplicationMenu } from './HeaderApplicationMenu'
import { HeaderLogoutButton } from './HeaderLogoutButton'

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
                  <HeaderApplicationMenu />
                  <HeaderLogoutButton />
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
