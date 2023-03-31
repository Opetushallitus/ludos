import logo from 'web/assets/oph_fin_vaaka.png'

export const Footer = () => {
  return (
    <div className="mb-3 grid h-full grid-cols-5 border-t-2 border-gray-light px-5 pt-3">
      <div className="col-span-2 mt-3">
        <img className="h-12" src={logo} alt="Opetushallitus logo" />
      </div>
      <div className="col-span-3 mt-3">
        <div className="row gap-3">
          <p className="text-green-primary">Jätä palautetta</p>
          <p className="text-green-primary">Käyttöehdot</p>
          <p className="text-green-primary">Tietosuoja</p>
        </div>
      </div>
    </div>
  )
}
