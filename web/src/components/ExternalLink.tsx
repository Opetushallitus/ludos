import { ReactNode } from 'react'
import { Icon } from './Icon'

interface ExternalLinkProps {
  url: string
  className?: string
  children: ReactNode
}

export const ExternalLink = ({ url, className, children }: ExternalLinkProps) => (
  <a
    className={`text-green-primary hover:underline ${className ? className : ''}`}
    href={url}
    target="_blank"
    rel="noopener noreferrer">
    <span className="row my-auto ml-3 gap-1">
      {children}
      <Icon name="uusi-valilehti" color="text-green-primary" size="base" />
    </span>
  </a>
)
