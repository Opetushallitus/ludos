import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps } from 'react'

export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    AriaAttributes {
  variant: 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost' | 'buttonDanger'
  testId?: string
}

export const Button = ({ variant, testId, children, ...props }: ButtonProps) => (
  <button className={`${variant} rounded-sm px-4 py-2`} data-testid={testId} {...props}>
    {children}
  </button>
)
