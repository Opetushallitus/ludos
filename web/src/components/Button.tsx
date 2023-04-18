import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps, FC } from 'react'

export interface TButton
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    AriaAttributes {
  variant: 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost'
  testId?: string
}

export const Button: FC<TButton> = ({ variant, testId, children, ...props }) => (
  <button className={`${variant} rounded px-4 py-2 font-bold`} data-testid={testId} {...props}>
    {children}
  </button>
)
