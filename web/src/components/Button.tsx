import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost' | 'buttonDanger'
export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    AriaAttributes {
  variant: ButtonVariant
  customClass?: string
}

export const Button = ({ variant, children, customClass, ...props }: ButtonProps) => {
  const isDisabled = props.disabled

  return (
    <button className={twMerge(buttonClasses(variant), customClass, isDisabled && 'opacity-50')} {...props}>
      {children}
    </button>
  )
}

export function buttonClasses(variant: ButtonVariant): string {
  return `${variant} rounded-sm px-4 py-2`
}
