import { ReactNode } from 'react'
import { FEEDBACK_EMAIL } from '../constants'
import { ExternalLink } from './ExternalLink'

interface FeedbackEmailLinkProps {
  'data-testid'?: string
  className?: string
  textColor?: 'text-green-primary' | 'text-black' | 'text-white' | 'text-red-primary' | 'text-gray-secondary'
  subject?: string
  children: ReactNode
}

export const FeedbackEmailLink = ({
  'data-testid': testId,
  className,
  textColor,
  subject,
  children
}: FeedbackEmailLinkProps) => {
  const url = subject ? `${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}` : FEEDBACK_EMAIL
  return (
    <ExternalLink
      url={url}
      hideIcon
      openInNewTab={false}
      data-testid={testId}
      className={className}
      textColor={textColor}
    >
      {children}
    </ExternalLink>
  )
}
