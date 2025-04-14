import type { IconifyIcon } from '@iconify/types'
import { twMerge } from 'tailwind-merge'

import outlineAssignment from '@iconify/icons-ic/outline-assignment'
import outlineHelpOutline from '@iconify/icons-ic/outline-help-outline'
import outlineVerified from '@iconify/icons-ic/outline-verified'
import close from '@iconify/icons-ic/close'
import deleteIcon from '@iconify/icons-ic/delete'
import edit from '@iconify/icons-ic/edit'
import outlineCheckCircle from '@iconify/icons-ic/outline-check-circle'
import check from '@iconify/icons-ic/check'
import error from '@iconify/icons-ic/error'
import add from '@iconify/icons-ic/add'
import openInNew from '@iconify/icons-ic/open-in-new'
import expandMore from '@iconify/icons-ic/expand-more'
import outlinePictureAsPdf from '@iconify/icons-ic/outline-picture-as-pdf'
import undo from '@iconify/icons-ic/undo'
import redo from '@iconify/icons-ic/redo'
import image from '@iconify/icons-ic/image'
import formatBold from '@iconify/icons-ic/format-bold'
import formatItalic from '@iconify/icons-ic/format-italic'
import formatParagraph from '@iconify/icons-material-symbols/format-paragraph'
import formatH1 from '@iconify/icons-material-symbols/format-h1'
import formatH2 from '@iconify/icons-material-symbols/format-h2'
import formatH3 from '@iconify/icons-material-symbols/format-h3'
import formatH4 from '@iconify/icons-material-symbols/format-h4'
import formatListBulleted from '@iconify/icons-ic/format-list-bulleted'
import formatListNumbered from '@iconify/icons-ic/format-list-numbered'
import formatQuote from '@iconify/icons-ic/format-quote'
import link from '@iconify/icons-ic/link'
import outlineFavoriteBorder from '@iconify/icons-ic/outline-favorite-border'
import outlineFavorite from '@iconify/icons-ic/outline-favorite'
import chevronLeft from '@iconify/icons-ic/chevron-left'
import chevronRight from '@iconify/icons-ic/chevron-right'
import outlineLogout from '@iconify/icons-ic/outline-logout'
import history from '@iconify/icons-ic/history'
import keyboardReturn from '@iconify/icons-ic/keyboard-return'
import outlineVisibility from '@iconify/icons-ic/outline-visibility'
import outlineInfo from '@iconify/icons-ic/outline-info'
import outlineFolder from '@iconify/icons-ic/outline-folder'
import moreHoriz from '@iconify/icons-ic/more-horiz'

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
const icons: Record<Icons, IconifyIcon> = {
  ['koetehtavat']: outlineAssignment,
  ['ohjeet']: outlineHelpOutline,
  ['todistukset']: outlineVerified,
  ['sulje']: close,
  ['poista']: deleteIcon,
  ['muokkaa']: edit,
  ['onnistunut']: outlineCheckCircle,
  ['check']: check,
  ['virhe']: error,
  ['lisää']: add,
  ['uusi-valilehti']: openInNew,
  ['laajenna']: expandMore,
  ['pdf']: outlinePictureAsPdf,
  ['undo']: undo,
  ['redo']: redo,
  ['kuva']: image,
  ['lihavointi']: formatBold,
  ['kursiivi']: formatItalic,
  ['paragraph']: formatParagraph,
  ['h1']: formatH1,
  ['h2']: formatH2,
  ['h3']: formatH3,
  ['h4']: formatH4,
  ['bulletList']: formatListBulleted,
  ['orderedList']: formatListNumbered,
  ['blockQuote']: formatQuote,
  ['link']: link,
  ['suosikki-border']: outlineFavoriteBorder,
  ['suosikki']: outlineFavorite,
  ['chevronLeft']: chevronLeft,
  ['chevronRight']: chevronRight,
  ['logout']: outlineLogout,
  ['versiohistoria']: history,
  ['palauta']: keyboardReturn,
  ['katsele']: outlineVisibility,
  ['info']: outlineInfo,
  ['kansio']: outlineFolder,
  ['kolme-pistetta']: moreHoriz
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
      <span className="inline-block align-top">
        <svg
          className="block mx-auto w-[1em] h-[1em]"
          dangerouslySetInnerHTML={{ __html: icons[name]?.body }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${outlineAssignment.width} ${outlineAssignment.height}`}
        />
      </span>
    </i>
  )
}
