import { NavLink, NavLinkProps, useNavigate } from 'react-router-dom'

interface InternalNavLinkProps extends NavLinkProps {
  navigateTo?: string // Take user to a different location than "to" prop. Useful for a second level of NavLinks
}

export const InternalNavLink = ({ navigateTo, ...props }: InternalNavLinkProps) => {
  const navigate = useNavigate()

  return (
    <NavLink
      onClick={(e) => {
        props.onClick?.(e)
        if (!e.defaultPrevented && navigateTo) {
          e.preventDefault()
          navigate(navigateTo, { replace: props.replace })
        }
      }}
      {...props}
    >
      {props.children}
    </NavLink>
  )
}
