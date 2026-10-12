import { AriaAttributes, ButtonHTMLAttributes, DetailedHTMLProps, ForwardedRef, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'buttonPrimary' | 'buttonSecondary' | 'buttonGhost' | 'buttonDanger'

const buttonVariantClasses: Record<ButtonVariant, string> = {
  buttonPrimary: 'bg-green-primary text-white hover:bg-green-light',
  buttonSecondary: 'border-2 border-green-primary text-green-primary hover:bg-green-primary hover:text-white',
  buttonGhost: 'text-black bg-none hover:bg-gray-light',
  buttonDanger: 'border-2 border-red-primary text-red-primary hover:bg-red-light'
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
  return `${buttonVariantClasses[variant]} rounded-xs px-4 py-2`
}
