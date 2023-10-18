import { HeaderDropdown } from './HeaderDropdown'
import { LOGOUT_URL } from '../../constants'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { HeaderFavorites } from './HeaderFavorites'
import { InternalNavLink } from '../InternalNavLink'
import { HeaderPage } from './Header'

export type LocaleDropdownOptions = Record<string, { name: string; testId?: string }>

export const HeaderDesktop = ({ pages }: { pages: HeaderPage[] }) => {
  const { LANGUAGE_DROPDOWN, t, i18n } = useLudosTranslation()
  const { isYllapitaja } = useUserDetails()
  const { userFavoriteAssignmentCount } = useContext(LudosContext)

  const { firstNames, lastName, role } = useUserDetails()

  const currentLanguageKey = i18n.language

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
  }
  const handleOptionClick = (opt: string | null) => {
    if (opt === 'logout') {
      document.location = LOGOUT_URL
    }
  }

  // filter out keys option if not YLLAPITAJA
  const { keys, ...languageDropdownOptionsWithoutShowKeys } = LANGUAGE_DROPDOWN
  const languageDropdownOptions = isYllapitaja ? LANGUAGE_DROPDOWN : languageDropdownOptionsWithoutShowKeys

  return (
    <div className="flex justify-center bg-gray-bg">
      <div className="w-[80vw]">
        <div className="row justify-between pt-3">
          <h1>{t('title.ludos')}</h1>
          <div className="flex h-6 flex-row gap-4">
            <div className="relative">
              <HeaderDropdown
                currentOption={`${firstNames} ${lastName}` || t('mobile.valikko')}
                options={{
                  logout: { name: t('common.kirjaudu-ulos'), testId: 'logout-button' }
                }}
                onOptionClick={handleOptionClick}
                testId="header-user-dropdown"
              />
              <p className="text-xss" data-testid="header-user-role">
                {role}
              </p>
            </div>

            <HeaderFavorites userFavoriteAssignmentCount={userFavoriteAssignmentCount} />

            <div className="relative border-l-2 border-green-primary pl-5">
              <HeaderDropdown
                currentOption={languageDropdownOptions[currentLanguageKey].name}
                options={languageDropdownOptions}
                onOptionClick={(str) => changeLanguage(str)}
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
