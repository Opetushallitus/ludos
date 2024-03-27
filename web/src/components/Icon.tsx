import { twMerge } from 'tailwind-merge'
import 'iconify-icon'

type IconProps = {
  name: Icons
  color: 'text-green-primary' | 'text-black' | 'text-white' | 'text-red-primary' | 'text-gray-secondary'
  disabled?: boolean
  size?: 'sm' | 'base' | 'lg'
  dataTestId?: string
  customClass?: string
}

export type Icons =
  | 'koetehtavat'
  | 'ohjeet'
  | 'todistukset'
  | 'sulje'
  | 'poista'
  | 'muokkaa'
  | 'onnistunut'
  | 'virhe'
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
  | 'suosikki-border'
  | 'suosikki'
  | 'chevronLeft'
  | 'chevronRight'
  | 'logout'
  | 'check'
  | 'versiohistoria'
  | 'palauta'
  | 'katsele'
  | 'info'
  | 'kansio'
  | 'kolme-pistetta'

// icons from https://icon-sets.iconify.design/
// ic = google material icons
// material-symbols-light
const icons: Record<Icons, string> = {
  ['koetehtavat']: 'ic:outline-assignment',
  ['ohjeet']: 'ic:outline-help-outline',
  ['todistukset']: 'ic:outline-verified',
  ['sulje']: 'ic:close',
  ['poista']: 'ic:delete',
  ['muokkaa']: 'ic:edit',
  ['onnistunut']: 'ic:outline-check-circle',
  ['check']: 'ic:check',
  ['virhe']: 'ic:error',
  ['lisää']: 'ic:add',
  ['uusi-valilehti']: 'ic:open-in-new',
  ['laajenna']: 'ic:expand-more',
  ['pdf']: 'ic:outline-picture-as-pdf',
  ['undo']: 'ic:undo',
  ['redo']: 'ic:redo',
  ['kuva']: 'ic:image',
  ['lihavointi']: 'ic:format-bold',
  ['kursiivi']: 'ic:format-italic',
  ['paragraph']: 'ic:format-paragraph',
  ['h1']: 'material-symbols:format-h1',
  ['h2']: 'material-symbols:format-h2',
  ['h3']: 'material-symbols:format-h3',
  ['h4']: 'material-symbols:format-h4',
  ['bulletList']: 'ic:format-list-bulleted',
  ['orderedList']: 'ic:format-list-numbered',
  ['blockQuote']: 'ic:format-quote',
  ['link']: 'ic:link',
  ['suosikki-border']: 'ic:outline-favorite-border',
  ['suosikki']: 'ic:outline-favorite',
  ['chevronLeft']: 'ic:chevron-left',
  ['chevronRight']: 'ic:chevron-right',
  ['logout']: 'ic:outline-logout',
  ['versiohistoria']: 'ic:history',
  ['palauta']: 'ic:keyboard-return',
  ['katsele']: 'ic:outline-visibility',
  ['info']: 'ic:outline-info',
  ['kansio']: 'ic:outline-folder',
  ['kolme-pistetta']: 'ic:more-horiz'
}

export const Icon = ({ name, color, disabled = false, size, dataTestId, customClass }: IconProps) => {
  const className = twMerge(color, size ? `text-${size}` : 'text-base', customClass, disabled && 'opacity-50')

  return (
    <i className={className} data-testid={dataTestId}>
      <iconify-icon icon={icons[name]}></iconify-icon>
    </i>
  )
}
