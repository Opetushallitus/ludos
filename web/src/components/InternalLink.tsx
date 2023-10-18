import { Link, LinkProps } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'

interface InternalLinkProps extends LinkProps {
  disabled?: boolean
}

export const InternalLink = ({ className, disabled, children, ...props }: InternalLinkProps) => (
  <Link
    className={twMerge(
      'text-green-primary hover:underline',
      disabled && 'text-gray-secondary pointer-events-none',
      className
    )}
    aria-disabled={disabled}
    {...props}>
    {children}
  </Link>
)
