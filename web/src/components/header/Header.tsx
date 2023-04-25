import { NavLink } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useTranslation } from 'react-i18next'
import { LocaleDropdown } from './LocaleDropdown'
import { useEffect, useRef, useState } from 'react'
import { useFetch } from '../useFetch'
import { Button } from '../Button'

export type Languages = 'fi' | 'sv' | 'keys'

export type LanguageOption = Record<Languages, { name: string }>

const options: LanguageOption = {
  fi: { name: 'Suomi' },
  sv: { name: 'Svenska' },
  keys: { name: 'Näytä avaimet' }
}

export const Header = () => {
  const { t, i18n } = useTranslation()
  const { data } = useFetch<{ name: string }>('auth')
  const [isExpanded, setExpansion] = useState(false)

  const closeOnBlurRef = useDropdownCloseOnBlur(setExpansion)

  const currentLanguageKey = i18n.language as Languages

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  return (
    <div className="flex justify-center bg-gray-bg">
      <div className="w-[80vw]">
        <div className="row justify-between pt-3">
          <h1 className="font-bold">{t('title.ludos')}</h1>
          <div className="flex h-6 flex-row gap-3">
            <Button className="m-0" variant="buttonGhost" onClick={() => (document.location = '/api/logout')}>
              {data && <p>{data.name}</p>}
            </Button>
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

export function useDropdownCloseOnBlur(setExpansion: (bool: boolean) => void) {
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
