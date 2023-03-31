import { NavLink } from 'react-router-dom'
import { frontpageKey, getPage } from './routes/routes'
import { Page } from '../types'

function getBreadcrumb(pathname: string) {
  if (pathname === frontpageKey) {
    return undefined
  }
  // split the path name to individual paths and remove the initial '/' path
  const pathComponents = pathname.split('/').filter((str) => str.length > 1)

  const pages = pathComponents
    // map each path component to a page
    .map((pageKeyStr) => getPage(pageKeyStr))
    // filter out any undefined values (i.e. invalid paths)
    .filter((pageOrUndefined): pageOrUndefined is Page => pageOrUndefined !== undefined)

  // add the etusivu page to the beginning of the array and return
  return [{ title: 'etusivu', path: '/' }, ...pages]
}
export const Breadcrumbs = ({ pathname }: { pathname: string }) => {
  const breadcrumbs = getBreadcrumb(pathname)

  return (
    <>
      {breadcrumbs && (
        <div className="block pt-3">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <NavLink
                className={`pr-1 ${isLast ? 'text-gray-primary' : 'text-green-primary'}`}
                to={crumb.path}
                key={i}>
                <span className="inline-block first-letter:capitalize">
                  {crumb.title} {isLast ? '' : '/'}
                </span>
              </NavLink>
            )
          })}
        </div>
      )}
    </>
  )
}
