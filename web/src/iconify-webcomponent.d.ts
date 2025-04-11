declare namespace JSX {
  import type { IconifyIconProperties } from 'iconify-icon'

  interface IntrinsicElements {
    'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & IconifyIconProperties, HTMLElement>
  }
}
