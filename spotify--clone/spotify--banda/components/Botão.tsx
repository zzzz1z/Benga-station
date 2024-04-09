import { forwardRef} from "react"
import { twMerge } from "tailwind-merge";

interface buttonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = forwardRef<HTMLButtonElement, buttonProps>(({
    className,
    children,
    disabled,
    type = 'button',
    ...props
}, ref) => {
  return (

    <button
    type={type}
    className={twMerge(`
    w-full
    rounded-full
    bg-red-500
    border
    border-transparent
    px-3
    py-3
    disabled:cursor-not-alloweddisabled:opacity-50
    text-black
    font-bold
    hover:opacity-75
    transition
    `,
    className
    )}
    disabled={disabled}
    ref={ref}
    {...props}
    >

     {children}

    </button>
  )
})

Button.displayName = 'Button';

export default Button
