type IconProps = {
  name: Icons
  color: 'text-green-primary' | 'text-black' | 'text-white'
}

type Icons =
  | 'koetehtävät'
  | 'ohjeet'
  | 'todistukset'
  | 'palautteet'
  | 'sulje'
  | 'poista'
  | 'muokkaa'
  | 'onnistunut'
  | 'virheellinen'
  | 'ostoskori'
  | 'lisää'
  | 'uusi-valilehti'

const icons: Record<Icons, string> = {
  ['koetehtävät']: 'assignment',
  ['ohjeet']: 'help',
  ['todistukset']: 'verified',
  ['palautteet']: 'chat',
  ['sulje']: 'close',
  ['poista']: 'delete',
  ['muokkaa']: 'edit',
  ['onnistunut']: 'check_circle',
  ['virheellinen']: 'error',
  ['ostoskori']: 'shopping_basket',
  ['lisää']: 'add',
  ['uusi-valilehti']: 'open_in_new'
}

export const Icon = ({ name, color }: IconProps) => (
  <i className={`material-symbols-outlined ${color}`}>{icons[name]}</i>
)
