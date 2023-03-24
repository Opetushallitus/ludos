export const Header = () => {
  const titles = ['etusivu', 'koetehtävät', 'ohjeet', 'todistukset', 'palautteet']

  return (
    <div>
      <div className="row justify-between px-5 pt-3">
        <h1>KOEPANKKI</h1>
        <div className="flex flex-row gap-3">
          <p>Käyttäjä</p>
          <p>Latauskori</p>
          <p>Kieli</p>
        </div>
      </div>
      <nav className="row px-5 pt-3">
        <ul className="row space-x-8">
          {titles.map((title, i) => (
            <li key={i}>
              <a className="text-blue-700">{title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
