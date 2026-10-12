import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps, ForwardedRef, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost' | 'buttonDanger'

const buttonTextColors: Record<ButtonVariant, string> = {
  buttonPrimary: 'text-white',
  buttonSecondary: 'text-green-primary',
  buttonGhost: 'text-black',
  buttonDanger: 'text-red-primary'
}

export interface ButtonProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
    AriaAttributes {
  variant: ButtonVariant
  customClass?: string
}

export const Button = forwardRef(
  ({ variant, children, customClass, ...props }: ButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const isDisabled = props.disabled

    return (
      <button ref={ref} className={twMerge(buttonClasses(variant), customClass, isDisabled && 'opacity-50')} {...props}>
        {children}
      </button>
    )
  }
)

export function buttonClasses(variant: ButtonVariant): string {
  return `${variant} ${buttonTextColors[variant]} rounded-xs px-4 py-2`
}
