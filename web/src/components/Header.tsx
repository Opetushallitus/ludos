import { NavLink } from 'react-router-dom'
import { Pages } from '../types'

export const Header = ({ pages }: { pages: Pages[] }) => {
  return (
    <div>
      <div className="row justify-between px-5 pt-3">
        <h1 className="font-bold">koepankki</h1>
        <div className="flex h-6 flex-row gap-3">
          <p className="text-green-primary">Käyttäjä</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Latauskori</p>
          <p className="m-0 border-l-2 border-green-primary pl-5 text-green-primary">Kieli</p>
        </div>
      </div>
      <nav className="row px-5 pt-3">
        <ul className="row space-x-8">
          {pages.map((page, i) => (
            <li key={i}>
              <NavLink
                to={page.key}
                className={({ isActive }) =>
                  `text-lg text-gray-primary capitalize${isActive ? ' border-b-5 border-b-green-primary' : ''}`
                }>
                {page.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
