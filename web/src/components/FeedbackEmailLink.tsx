import { ReactNode } from 'react'
import { FEEDBACK_EMAIL } from '../constants'
import { ExternalLink } from './ExternalLink'

interface FeedbackEmailLinkProps {
  'data-testid'?: string
  className?: string
  textColor?: 'text-green-primary' | 'text-black' | 'text-white' | 'text-red-primary' | 'text-gray-secondary'
  children: ReactNode
}

export const FeedbackEmailLink = ({
  'data-testid': testId,
  className,
  textColor,
  children
}: FeedbackEmailLinkProps) => (
  <ExternalLink
    url={FEEDBACK_EMAIL}
    hideIcon
    openInNewTab={false}
    data-testid={testId}
    className={className}
    textColor={textColor}
  >
    {children}
  </ExternalLink>
)
