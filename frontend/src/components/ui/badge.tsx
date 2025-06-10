import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-green-900/30 text-green-300 border border-green-500/30 hover:bg-green-900/40",
        warning:
          "bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-900/40",
        info:
          "bg-blue-900/30 text-blue-300 border border-blue-500/30 hover:bg-blue-900/40",
        highlight:
          "bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 