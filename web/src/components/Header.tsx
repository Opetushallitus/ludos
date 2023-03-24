export const Header = () => {
  const titles = ['etusivu', 'koetehtävät', 'ohjeet', 'todistukset', 'palautteet']

  return (
    <div>
      <div className="row justify-between px-5 pt-3">
        <h1 className="font-bold">koepankki</h1>
        <div className="flex h-6 flex-row gap-3">
          <p className="text-green-primary">Käyttäjä</p>
          <p className="text-green-primary border-green-primary m-0 border-l-2 pl-5">Latauskori</p>
          <p className="text-green-primary border-green-primary m-0 border-l-2 pl-5">Kieli</p>
        </div>
      </div>
      <nav className="row px-5 pt-3">
        <ul className="row space-x-8">
          {titles.map((title, i) => (
            <li key={i}>
              <a className="text-gray-primary text-lg font-semibold">{title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
