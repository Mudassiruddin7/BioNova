import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-700",
        destructive: "bg-red-600/20 text-red-300 hover:bg-red-600/40 hover:text-red-200 border border-red-500/30",
        outline: "border border-indigo-500/30 bg-transparent hover:bg-indigo-900/20 text-indigo-300",
        secondary: "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-500/30",
        ghost: "hover:bg-indigo-900/20 text-indigo-300",
        link: "text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        xs: "h-6 rounded-md px-2 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
      <button
      className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
      {...props}
    />
  )
}
)
Button.displayName = "Button"

export { Button, buttonVariants }
