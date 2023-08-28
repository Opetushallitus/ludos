import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import { twMerge } from 'tailwind-merge'

export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    AriaAttributes {
  variant: 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost' | 'buttonDanger'
  customClass?: string
}

export const Button = ({ variant, children, customClass, ...props }: ButtonProps) => {
  const isDisabled = props.disabled

  return (
    <button className={twMerge(`${variant} rounded-sm px-4 py-2`, customClass, isDisabled && 'opacity-50')} {...props}>
      {children}
    </button>
  )
}
