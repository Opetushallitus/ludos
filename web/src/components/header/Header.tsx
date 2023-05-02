import { NavLink } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useTranslation } from 'react-i18next'
import { HeaderDropdown } from './HeaderDropdown'
import { useEffect, useState } from 'react'
import { useFetch } from '../../hooks/useFetch'

export type LocaleDropdownOptions = Record<string, { name: string }>

const languageOptions: LocaleDropdownOptions = {
  fi: { name: 'Suomi' },
  sv: { name: 'Svenska' },
  keys: { name: 'Näytä avaimet' }
}

const authOptions: LocaleDropdownOptions = {
  logout: { name: 'Kirjaudu ulos' }
}

export const Header = () => {
  const { t, i18n } = useTranslation()
  const { data } = useFetch<{ name: string }>('auth')
  const [currentOption, setCurrentOption] = useState<string | null>(null)

  const currentLanguageKey = i18n.language

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  useEffect(() => {
    if (data && data.name) {
      setCurrentOption(data.name)
    }
  }, [data])

  const handleOptionClick = (opt: string | null) => {
    if (opt === 'logout') {
      document.location = '/api/logout'
    }
  }

  return (
    <div className="flex justify-center bg-gray-bg">
      <div className="w-[80vw]">
        <div className="row justify-between pt-3">
          <h1>{t('title.ludos')}</h1>
          <div className="flex h-6 flex-row gap-3">
            <div className="relative">
              <HeaderDropdown
                currentOption={currentOption || ''}
                options={authOptions}
                onOptionClick={handleOptionClick}
              />
            </div>
            <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Latauskori</p>
            <div className="relative border-l-2 border-green-primary pl-5">
              <HeaderDropdown
                currentOption={languageOptions[currentLanguageKey].name}
                options={languageOptions}
                onOptionClick={(str) => changeLanguage(str)}
              />
            </div>
          </div>
        </div>
        <nav className="row pb-1 pt-3">
          <ul className="row gap-6 whitespace-nowrap">
            {Object.values(navigationPages).map(({ path, titleKey }, i) => (
              <li key={i}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `p-1 text-lg text-gray-primary hover:bg-gray-light${
                      isActive ? ' border-b-5 border-b-green-primary text-green-primary' : ''
                    }`
                  }
                  data-testid={`nav-link-${path.substring(1).replaceAll('/', '-')}`}>
                  {t(`header.${titleKey}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
