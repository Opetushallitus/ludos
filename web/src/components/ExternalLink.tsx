import { HTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'
import { twMerge } from 'tailwind-merge'

interface ExternalLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  url: string
  className?: string
  textColor?: 'text-green-primary' | 'text-black' | 'text-white' | 'text-red-primary' | 'text-gray-secondary'
  openInNewTab?: boolean
  hideIcon?: boolean
  children: ReactNode
}

export const ExternalLink = ({
  url,
  className,
  textColor = 'text-green-primary',
  openInNewTab = true,
  hideIcon = false,
  children,
  ...props
}: ExternalLinkProps) => (
  <a
    className={twMerge('hover:underline', className, textColor)}
    href={url}
    target={openInNewTab ? '_blank' : '_self'}
    rel="noopener noreferrer"
    {...props}>
    <span className="row items-center gap-1">
      {children}
      {openInNewTab && !hideIcon && <Icon name="uusi-valilehti" color={textColor} size="base" />}
    </span>
  </a>
)
