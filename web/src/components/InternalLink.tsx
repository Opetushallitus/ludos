import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AssignmentIn } from '../types'

interface InternalLinkProps {
  to: string
  state?: {
    [key: string]: string | AssignmentIn
  }
  className?: string
  testId?: string
  children: ReactNode
}

export const InternalLink = ({ to, state, className, children, testId }: InternalLinkProps) => (
  <Link
    data-testid={testId}
    className={`${className ? className : 'text-green-primary hover:underline'}`}
    to={to}
    state={state}>
    {children}
  </Link>
)
