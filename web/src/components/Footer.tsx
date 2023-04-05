import logo from 'web/assets/oph_fin_vaaka.png'

export const Footer = () => (
  <div className="mt-5 border-t-2 border-gray-separator pb-4 pt-3">
    <div className="flex flex-wrap md:px-10">
      <div className="flex w-full flex-col md:w-3/12">
        <div className="flex justify-center pb-5 pt-3">
          <img className="h-12" src={logo} alt="Opetushallitus logo" />
        </div>
      </div>
      <span className="hidden md:flex md:w-2/12 md:flex-col" />
      <div className="mt-3 flex w-1/3 flex-col text-center md:w-2/12 md:text-left">
        <p className="text-green-primary">Palaute</p>
      </div>
      <div className="mt-3 flex w-1/3 flex-col text-center md:w-2/12 md:text-left">
        <p className="text-green-primary">Käyttöehdot</p>
      </div>
      <div className="mt-3 flex w-1/3 flex-col text-center md:w-3/12 md:text-left">
        <p className="text-green-primary">Tietosuoja</p>
      </div>
    </div>
  </div>
)
