import { Link, LinkProps } from 'react-router-dom'

export const InternalLink = ({ className, children, ...props }: LinkProps) => (
  <Link className={`${className ? className : 'text-green-primary hover:underline'}`} {...props}>
    {children}
  </Link>
)
