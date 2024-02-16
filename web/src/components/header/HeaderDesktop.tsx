import { HeaderDropdown } from './HeaderDropdown'
import { useContext } from 'react'
import { LudosContext } from '../../contexts/LudosContext'
import { HeaderFavorites } from './HeaderFavorites'
import { InternalNavLink } from '../InternalNavLink'
import { HeaderPage } from './Header'
import { useTranslation } from 'react-i18next'
import { HeaderUserInfoSelect } from './HeaderUserInfoSelect'

type HeaderDesktopProps = {
  pages: HeaderPage[]
}

export const HeaderDesktop = ({ pages }: HeaderDesktopProps) => {
  const { t } = useTranslation()
  const { userFavoriteAssignmentCount } = useContext(LudosContext)

  return (
    <div className="flex justify-center bg-gray-bg pt-3">
      <div className="w-[80vw]">
        <div className="row justify-between items-center">
          <h1>{t('title.ludos')}</h1>
          <div className="flex flex-row items-center h-10 gap-4">
            <HeaderUserInfoSelect />

            <HeaderFavorites userFavoriteAssignmentCount={userFavoriteAssignmentCount} />

            <div className="border-l border-green-primary pl-2">
              <HeaderDropdown />
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
