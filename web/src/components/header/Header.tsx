import { NavLink } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useTranslation } from 'react-i18next'
import { LocaleDropdown } from './LocaleDropdown'
import { useEffect, useRef, useState } from 'react'

export type Languages = 'fi' | 'sv'

export type LanguageOption = Record<Languages, { name: string }>

const options: LanguageOption = {
  fi: { name: 'Suomi' },
  sv: { name: 'Svenska' }
}

export const Header = () => {
  const { t, i18n } = useTranslation()
  const [isExpanded, setExpansion] = useState(false)
  const closeOnBlurRef = useDropdownCloseOnBlur(setExpansion)

  const currentLanguageKey = i18n.language as Languages

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
  }

  return (
    <div className="flex justify-center bg-gray-bg">
      <div className="w-[80vw]">
        <div className="row justify-between pt-3">
          <h1 className="font-bold">{t('otsikko.ludos')}</h1>
          <div className="flex h-6 flex-row gap-3">
            <p className="text-green-primary">Käyttäjä</p>
            <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Latauskori</p>
            <LocaleDropdown
              currentLanguage={options[currentLanguageKey].name}
              options={options}
              isExpanded={isExpanded}
              onOptionClick={(str) => changeLanguage(str)}
              setExpansion={setExpansion}
              closeOnBlurRef={closeOnBlurRef}
            />
          </div>
        </div>
        <nav className="row pb-1 pt-3">
          <ul className="row gap-6">
            {Object.values(navigationPages).map(({ path, title }, i) => (
              <li key={i}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `p-1 text-lg text-gray-primary hover:bg-gray-light${
                      isActive ? ' border-b-5 border-b-green-primary text-green-primary' : ''
                    }`
                  }
                  data-testid={`nav-link-${path.substring(1).replaceAll('/', '-')}`}>
                  {title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

function useDropdownCloseOnBlur(setExpansion: (bool: boolean) => void) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExpansion(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [dropdownRef, setExpansion])

  return dropdownRef
}
