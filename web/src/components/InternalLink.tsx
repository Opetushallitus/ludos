import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface InternalLinkProps {
  to: string
  className?: string
  children: ReactNode
}

export const InternalLink = ({ to, className, children }: InternalLinkProps) => (
  <Link className={`${className ? className : 'text-green-primary hover:underline'}`} to={to}>
    {children}
  </Link>
)
