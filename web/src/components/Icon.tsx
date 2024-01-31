import { twMerge } from 'tailwind-merge'

type IconProps = {
  name: Icons
  color: 'text-green-primary' | 'text-black' | 'text-white' | 'text-red-primary' | 'text-gray-secondary'
  disabled?: boolean
  filled?: boolean
  size?: 'sm' | 'base' | 'lg'
  dataTestId?: string
  customClass?: string
}

export type Icons =
  | 'koetehtavat'
  | 'ohjeet'
  | 'todistukset'
  | 'palautteet'
  | 'sulje'
  | 'poista'
  | 'muokkaa'
  | 'onnistunut'
  | 'virhe'
  | 'ostoskori'
  | 'lisää'
  | 'uusi-valilehti'
  | 'laajenna'
  | 'pdf'
  | 'undo'
  | 'redo'
  | 'kuva'
  | 'lihavointi'
  | 'kursiivi'
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bulletList'
  | 'orderedList'
  | 'blockQuote'
  | 'link'
  | 'suosikki'
  | 'chevronLeft'
  | 'chevronRight'
  | 'logout'
  | 'check'
  | 'versiohistoria'
  | 'palauta'
  | 'katsele'
  | 'info'

const icons: Record<Icons, string> = {
  ['koetehtavat']: 'assignment',
  ['ohjeet']: 'help',
  ['todistukset']: 'verified',
  ['palautteet']: 'chat',
  ['sulje']: 'close',
  ['poista']: 'delete',
  ['muokkaa']: 'edit',
  ['onnistunut']: 'check_circle',
  ['check']: 'check',
  ['virhe']: 'error',
  ['ostoskori']: 'shopping_basket',
  ['lisää']: 'add',
  ['uusi-valilehti']: 'open_in_new',
  ['laajenna']: 'expand_more',
  ['pdf']: 'picture_as_pdf',
  ['undo']: 'undo',
  ['redo']: 'redo',
  ['kuva']: 'image',
  ['lihavointi']: 'format_bold',
  ['kursiivi']: 'format_italic',
  ['paragraph']: 'format_paragraph',
  ['h1']: 'format_h1',
  ['h2']: 'format_h2',
  ['h3']: 'format_h3',
  ['h4']: 'format_h4',
  ['bulletList']: 'format_list_bulleted',
  ['orderedList']: 'format_list_numbered',
  ['blockQuote']: 'format_quote',
  ['link']: 'link',
  ['suosikki']: 'favorite',
  ['chevronLeft']: 'chevron_left',
  ['chevronRight']: 'chevron_right',
  ['logout']: 'logout',
  ['versiohistoria']: 'history',
  ['palauta']: 'keyboard_return',
  ['katsele']: 'visibility',
  ['info']: 'info'
}

export const Icon = ({ name, color, disabled = false, filled = false, size, dataTestId, customClass }: IconProps) => {
  const className = twMerge(
    `material-symbols-outlined ${color}`,
    size ? `text-${size}` : 'text-base',
    customClass,
    disabled && 'opacity-50',
    filled && 'material-symbols-outlined-filled'
  )

  return (
    <i className={className} data-testid={dataTestId}>
      {icons[name]}
    </i>
  )
}
