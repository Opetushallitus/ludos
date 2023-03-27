import { NavLink } from 'react-router-dom'
import { navigationPages } from './routes/routes'

export const Header = () => {
  return (
    <div>
      <div className="row justify-between pt-3">
        <h1 className="font-bold">koepankki</h1>
        <div className="flex h-6 flex-row gap-3">
          <p className="text-green-primary">Käyttäjä</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Latauskori</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Kieli</p>
        </div>
      </div>
      <nav className="row pt-3">
        <ul className="row space-x-8">
          {Object.values(navigationPages).map(({ path, title }, i) => (
            <li key={i}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `text-lg text-gray-primary capitalize${
                    isActive ? ' border-b-5 border-b-green-primary text-green-primary' : ''
                  }`
                }
                data-testid={`nav-link-${path.substring(1)}`}>
                {title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
