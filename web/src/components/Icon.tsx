import { twMerge } from 'tailwind-merge'
import 'iconify-icon'
import { addIcon } from 'iconify-icon'

import outlineAssignment from '@iconify/icons-ic/outline-assignment'
addIcon('ic:outline-assignment', outlineAssignment)

import outlineHelpOutline from '@iconify/icons-ic/outline-help-outline'
addIcon('ic:outline-help-outline', outlineHelpOutline)

import outlineVerified from '@iconify/icons-ic/outline-verified'
addIcon('ic:outline-verified', outlineVerified)

import close from '@iconify/icons-ic/close'
addIcon('ic:close', close)

import deleteIcon from '@iconify/icons-ic/delete'
addIcon('ic:delete', deleteIcon)

import edit from '@iconify/icons-ic/edit'
addIcon('ic:edit', edit)

import outlineCheckCircle from '@iconify/icons-ic/outline-check-circle'
addIcon('ic:outline-check-circle', outlineCheckCircle)

import check from '@iconify/icons-ic/check'
addIcon('ic:check', check)

import error from '@iconify/icons-ic/error'
addIcon('ic:error', error)

import add from '@iconify/icons-ic/add'
addIcon('ic:add', add)

import openInNew from '@iconify/icons-ic/open-in-new'
addIcon('ic:open-in-new', openInNew)

import expandMore from '@iconify/icons-ic/expand-more'
addIcon('ic:expand-more', expandMore)

import outlinePictureAsPdf from '@iconify/icons-ic/outline-picture-as-pdf'
addIcon('ic:outline-picture-as-pdf', outlinePictureAsPdf)

import undo from '@iconify/icons-ic/undo'
addIcon('ic:undo', undo)

import redo from '@iconify/icons-ic/redo'
addIcon('ic:redo', redo)

import image from '@iconify/icons-ic/image'
addIcon('ic:image', image)

import formatBold from '@iconify/icons-ic/format-bold'
addIcon('ic:format-bold', formatBold)

import formatItalic from '@iconify/icons-ic/format-italic'
addIcon('ic:format-italic', formatItalic)

import formatParagraph from '@iconify/icons-material-symbols/format-paragraph'
addIcon('material-symbols:format-paragraph', formatParagraph)

import formatH1 from '@iconify/icons-material-symbols/format-h1'
addIcon('material-symbols:format-h1', formatH1)

import formatH2 from '@iconify/icons-material-symbols/format-h2'
addIcon('material-symbols:format-h2', formatH2)

import formatH3 from '@iconify/icons-material-symbols/format-h3'
addIcon('material-symbols:format-h3', formatH3)

import formatH4 from '@iconify/icons-material-symbols/format-h4'
addIcon('material-symbols:format-h4', formatH4)

import formatListBulleted from '@iconify/icons-ic/format-list-bulleted'
addIcon('ic:format-list-bulleted', formatListBulleted)

import formatListNumbered from '@iconify/icons-ic/format-list-numbered'
addIcon('ic:format-list-numbered', formatListNumbered)

import formatQuote from '@iconify/icons-ic/format-quote'
addIcon('ic:format-quote', formatQuote)

import link from '@iconify/icons-ic/link'
addIcon('ic:link', link)

import outlineFavoriteBorder from '@iconify/icons-ic/outline-favorite-border'
addIcon('ic:outline-favorite-border', outlineFavoriteBorder)

import outlineFavorite from '@iconify/icons-ic/outline-favorite'
addIcon('ic:outline-favorite', outlineFavorite)

import chevronLeft from '@iconify/icons-ic/chevron-left'
addIcon('ic:chevron-left', chevronLeft)

import chevronRight from '@iconify/icons-ic/chevron-right'
addIcon('ic:chevron-right', chevronRight)

import outlineLogout from '@iconify/icons-ic/outline-logout'
addIcon('ic:outline-logout', outlineLogout)

import history from '@iconify/icons-ic/history'
addIcon('ic:history', history)

import keyboardReturn from '@iconify/icons-ic/keyboard-return'
addIcon('ic:keyboard-return', keyboardReturn)

import outlineVisibility from '@iconify/icons-ic/outline-visibility'
addIcon('ic:outline-visibility', outlineVisibility)

import outlineInfo from '@iconify/icons-ic/outline-info'
addIcon('ic:outline-info', outlineInfo)

import outlineFolder from '@iconify/icons-ic/outline-folder'
addIcon('ic:outline-folder', outlineFolder)

import moreHoriz from '@iconify/icons-ic/more-horiz'
addIcon('ic:more-horiz', moreHoriz)

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
  ['paragraph']: 'material-symbols:format-paragraph',
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
  const className = twMerge(
    'flex justify-center',
    color,
    size ? `text-${size}` : 'text-base',
    customClass,
    disabled && 'opacity-50'
  )

  return (
    <i className={className} data-testid={dataTestId}>
      <iconify-icon icon={icons[name]}></iconify-icon>
    </i>
  )
}
