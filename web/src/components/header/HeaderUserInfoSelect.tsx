import { Button } from '../Button'
import { Icon } from '../Icon'
import { HeaderApplicationMenu } from './HeaderApplicationMenu'
import { HeaderLogoutButton } from './HeaderLogoutButton'
import { useState } from 'react'
import { useDropdownCloseOnBlur } from '../../hooks/useDropdownCloseOnBlur'
import { useUserDetails } from '../../hooks/useUserDetails'

export const HeaderUserInfoSelect = () => {
  const { firstNames, lastName, role } = useUserDetails()

  const [showMenu, setShowMenu] = useState(false)
  const showMenuRef = useDropdownCloseOnBlur<boolean>(false, setShowMenu)

  return (
    <div className="relative" ref={showMenuRef}>
      <Button
        className="flex items-center text-green-primary"
        data-testid="user-menu-expand"
        onClick={() => setShowMenu(!showMenu)}
        variant="buttonGhost">
        {`${firstNames} ${lastName}`}
        <Icon name="laajenna" color="text-black" size="lg" />
      </Button>
      <p className="text-xss absolute" data-testid="header-user-role">
        {role}
      </p>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-max pr-3 rounded border border-gray-border bg-white">
          <HeaderApplicationMenu />
          <HeaderLogoutButton />
        </div>
      )}
    </div>
  )
}
