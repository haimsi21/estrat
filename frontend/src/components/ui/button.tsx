import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#c5a059] text-black font-bold shadow hover:bg-[#b38f46] hover:text-black",
        destructive: "bg-red-900/80 text-white shadow-sm hover:bg-red-900",
        outline: "border border-border bg-card text-foreground shadow-sm hover:border-[#c5a059]/50 hover:bg-[#c5a059]/10 hover:text-[#e0b868]",
        secondary: "bg-muted text-foreground border border-border hover:bg-muted/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-[#c5a059] underline-offset-4 hover:underline",
        gold: "bg-gradient-to-r from-[#c5a059] via-[#e0b868] to-[#c5a059] text-black font-bold shadow-md hover:brightness-110 border border-[#c5a059]/40",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
