import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeaderDropdown } from './HeaderDropdown'
import { LOGOUT_URL } from '../../constants'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useConstantsWithLocalization } from '../../hooks/useConstantsWithLocalization'
import { Page } from '../../types'
import { useContext } from 'react'
import { LudosContext } from '../../LudosContext'
import { HeaderFavorites } from './HeaderFavorites'

export type LocaleDropdownOptions = Record<string, { name: string; testId?: string }>

export const HeaderDesktop = ({ pages }: { pages: Page[] }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { LANGUAGE_DROPDOWN } = useConstantsWithLocalization()
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

            <HeaderFavorites
              onClick={() => navigate('/favorites')}
              userFavoriteAssignmentCount={userFavoriteAssignmentCount}
            />

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
            {pages.map(({ path, key }, i) => (
              <li key={i}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `p-1 text-lg text-gray-primary hover:bg-gray-light${
                      isActive ? ' border-b-5 border-b-green-primary text-green-primary' : ''
                    }`
                  }
                  data-testid={`nav-link-${key}`}>
                  {t(`header.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
