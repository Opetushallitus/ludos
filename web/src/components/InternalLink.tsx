import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AssignmentIn } from '../types'

interface InternalLinkProps {
  to: string
  target?: string
  state?: {
    [key: string]: string | AssignmentIn
  }
  className?: string
  testId?: string
  children: ReactNode
}

export const InternalLink = ({ to, target, state, className, children, testId }: InternalLinkProps) => (
  <Link
    data-testid={testId}
    className={`${className ? className : 'text-green-primary hover:underline'}`}
    to={to}
    state={state}
    target={target}>
    {children}
  </Link>
)
