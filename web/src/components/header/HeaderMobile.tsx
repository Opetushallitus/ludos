import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LudosContext } from '../../contexts/LudosContext'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useUserDetails } from '../../hooks/useUserDetails'
import { Language } from '../../types'
import { Button } from '../Button'
import { InternalNavLink } from '../InternalNavLink'
import { HeaderPage } from './Header'
import { HeaderApplicationMenu } from './HeaderApplicationMenu'
import { HeaderFavorites } from './HeaderFavorites'
import { HeaderLogoutButton } from './HeaderLogoutButton'

export const HeaderMobile = ({ pages }: { pages: HeaderPage[] }) => {
  const { LANGUAGE_DROPDOWN, t, lt } = useLudosTranslation()
  const { firstNames, lastName, role } = useUserDetails()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { uiLanguage, setUiLanguage } = useContext(LudosContext)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

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
              <div className="bg-white p-3">
                <p className="font-semibold">{`${firstNames} ${lastName}`}</p>
                <p className="text-gray-secondary">{role && lt.headerRoleTexts[role]}</p>
              </div>

              <nav className="flex h-full flex-col bg-white">
                {pages.map(({ path, key, localizationText, navigateTo }, i) => (
                  <InternalNavLink
                    to={path}
                    navigateTo={navigateTo}
                    onClick={toggleMenu}
                    key={i}
                    className={({ isActive }) =>
                      `pl-4 text-lg border-l-5${
                        isActive ? ' border-green-primary text-black' : ' border-white text-green-primary'
                      }`
                    }
                    data-testid={`nav-link-${key}`}
                  >
                    {localizationText}
                  </InternalNavLink>
                ))}
                <div className="mt-2 border-t-2 border-gray-separator bg-white py-2">
                  <p className="pl-5 text-gray-secondary">{t('header.kieli')}</p>
                  <div className="row w-full flex-wrap">
                    <Button
                      className={`col w-full pl-4 text-lg text-black${
                        uiLanguage === Language.FI ? ' border-l-5 border-green-primary' : ''
                      }`}
                      variant="buttonGhost"
                      onClick={() => setUiLanguage(Language.FI)}
                    >
                      {LANGUAGE_DROPDOWN.FI.nimi}
                    </Button>
                    <Button
                      className={`col w-full pl-4 text-lg text-black${
                        uiLanguage === Language.SV ? ' border-l-5 border-green-primary' : ''
                      }`}
                      variant="buttonGhost"
                      onClick={() => setUiLanguage(Language.SV)}
                    >
                      {LANGUAGE_DROPDOWN.SV.nimi}
                    </Button>
                  </div>
                </div>

                <HeaderApplicationMenu showBorder />
                <HeaderLogoutButton />
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Header(props: { onClick: () => void }) {
  const { t } = useLudosTranslation()
  const { userFavoriteAssignmentCount } = useContext(LudosContext)

  return (
    <div className="row w-full px-2">
      <div className="col w-1/12">
        <button
          className="flex flex-col items-center justify-center rounded-md p-2"
          onClick={props.onClick}
          aria-label={t('aria-label.header.avaa-valikko-nappi')}
        >
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="mb-1 h-[2px] w-6 bg-white"></span>
          <span className="text-[10px] text-white">{t('mobile.valikko')}</span>
        </button>
      </div>
      <div className="col mb-auto ml-4 w-9/12">
        <h1 className="text-white">{t('title.ludos')}</h1>
      </div>
      <div className="flex items-center">
        <HeaderFavorites userFavoriteAssignmentCount={userFavoriteAssignmentCount} isMobile />
      </div>
    </div>
  )
}
