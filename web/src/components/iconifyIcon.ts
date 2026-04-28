import type { IconifyIcon } from '@iconify/types'

export type IconifyIconModule = IconifyIcon | { default: IconifyIcon }

export function normalizeIconifyIcon(icon: IconifyIconModule): IconifyIcon {
  return 'default' in icon ? icon.default : icon
}
