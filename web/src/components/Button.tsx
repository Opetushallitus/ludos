import React from 'react'

export interface TButton
  extends React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    React.AriaAttributes {
  variant: 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost'
  testId?: string
}

export const Button: React.FC<TButton> = ({ variant, testId, children, ...props }) => (
  <button className={`${variant} rounded px-4 py-2 font-bold`} data-testid={testId} {...props}>
    {children}
  </button>
)
