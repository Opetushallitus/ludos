import { HTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

interface ExternalLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  url: string
  className?: string
  openInNewTab?: boolean
  children: ReactNode
}

export const ExternalLink = ({ url, className, openInNewTab = true, children, ...props }: ExternalLinkProps) => (
  <a
    className={`text-green-primary hover:underline ${className ? className : ''}`}
    href={url}
    target={openInNewTab ? '_blank' : '_self'}
    rel="noopener noreferrer"
    {...props}>
    <span className="row items-center gap-1">
      {children}
      {openInNewTab && <Icon name="uusi-valilehti" color="text-green-primary" size="base" />}
    </span>
  </a>
)
