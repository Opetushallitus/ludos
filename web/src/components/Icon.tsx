import { MouseEventHandler } from 'react'

type IconProps = {
  name: Icons
  color: 'text-green-primary' | 'text-black' | 'text-white'
  size?: 'sm' | 'base' | 'lg'
  onClick?: MouseEventHandler<HTMLButtonElement>
  dataTestId?: string
  customClass?: string
}

type Icons =
  | 'koetehtavat'
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
  | 'laajenna'
  | 'pdf'

const icons: Record<Icons, string> = {
  ['koetehtavat']: 'assignment',
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
  ['uusi-valilehti']: 'open_in_new',
  ['laajenna']: 'expand_more',
  ['pdf']: 'picture_as_pdf'
}

export const Icon = ({ name, color, size, onClick, dataTestId, customClass }: IconProps) => {
  const className = `material-symbols-outlined ${color} ${size ? `text-${size}` : 'text-base'} ${customClass} ${
    onClick ? 'cursor-pointer hover:bg-gray-light ' : ''
  }`
  return (
    <i className={className} onClick={onClick} data-testid={dataTestId}>
      {icons[name]}
    </i>
  )
}
