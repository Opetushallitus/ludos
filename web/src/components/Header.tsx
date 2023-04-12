import { NavLink } from 'react-router-dom'
import { navigationPages } from './routes/routes'

export const Header = () => (
  <div className="flex justify-center bg-gray-bg">
    <div className="w-[80vw]">
      <div className="row justify-between pt-3">
        <h1 className="font-bold">koepankki</h1>
        <div className="flex h-6 flex-row gap-3">
          <p className="text-green-primary">Käyttäjä</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Latauskori</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Kieli</p>
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
