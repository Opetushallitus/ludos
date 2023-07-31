import { NavLink } from 'react-router-dom'
import { navigationPages } from '../routes/routes'
import { useState } from 'react'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'
import { useUserDetails } from '../../hooks/useUserDetails'
import { useConstantsWithLocalization } from '../../hooks/useConstantsWithLocalization.tsx'

export const HeaderMobile = () => {
  const { t, i18n } = useTranslation()
  const { LANGUAGE_DROPDOWN } = useConstantsWithLocalization()
  const { name, role } = useUserDetails()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const changeLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  return (
    <div className="flex justify-center bg-green-primary">
      <div className="w-full">
        {!isMenuOpen ? (
          <Header onClick={toggleMenu} />
        ) : (
          <div className="block h-auto overflow-hidden transition-all duration-300">
            <div className="fixed inset-0 z-50">
              <div className="row justify-between bg-green-primary pt-2">
                <Header onClick={toggleMenu} />
              </div>
              <div className="bg-white p-3" onClick={(e) => e.stopPropagation}>
                <p className="font-semibold">{name || ''}</p>
                <p className="text-gray-secondary">{role}</p>
              </div>

              <nav className="flex h-full flex-col bg-white">
                {Object.values(navigationPages).map(({ path, titleKey }, i) => (
                  <NavLink
                    to={path}
                    onClick={toggleMenu}
                    key={i}
                    className={({ isActive }) =>
                      `pl-4 text-lg border-l-5${
                        isActive ? ' border-green-primary text-black' : ' border-white text-green-primary'
                      }`
                    }
                    data-testid={`nav-link-${path.substring(1)}`}>
                    {t(`header.${titleKey}`)}
                  </NavLink>
                ))}
                <div className="mt-2 border-t-2 border-gray-separator bg-white py-2">
                  <p className="pl-5 text-gray-secondary">{t('header.kieli')}</p>
                  <div className="row w-full flex-wrap">
                    <Button
                      className={`col w-full pl-4 text-lg text-black${
                        i18n.language === 'fi' ? ' border-l-5 border-green-primary' : ''
                      }`}
                      variant="buttonGhost"
                      onClick={() => changeLanguage('fi')}>
                      {LANGUAGE_DROPDOWN.fi.name}
                    </Button>
                    <Button
                      className={`col w-full pl-4 text-lg text-black${
                        i18n.language === 'sv' ? ' border-l-5 border-green-primary' : ''
                      }`}
                      variant="buttonGhost"
                      onClick={() => changeLanguage('sv')}>
                      {LANGUAGE_DROPDOWN.sv.name}
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Header(props: { onClick: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="row w-full px-2 py-1">
      <div className="col w-1/12">
        <button
          className="hover:bg-gray-200 focus:bg-gray-200 flex flex-col items-center justify-center rounded-md p-2"
          onClick={props.onClick}
          aria-label="Toggle menu">
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="text-[10px] text-white">{t('mobile.valikko')}</span>
        </button>
      </div>
      <div className="col mb-auto ml-4 w-9/12">
        <h1 className="text-white">{t('title.ludos')}</h1>
      </div>
      <div className="col mb-auto mt-2 w-2/12 text-center">
        <Icon name="ostoskori" color="text-white" />
      </div>
    </div>
  )
}
