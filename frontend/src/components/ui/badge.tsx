import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#c5a059] text-black font-bold shadow-sm hover:bg-[#b38f46]",
        secondary: "border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800",
        outline: "border-gray-800 text-gray-300 hover:bg-gray-900",
        gold: "border-[#c5a059]/40 bg-[#c5a059]/10 text-[#e0b868]",
        destructive: "border-red-900/50 bg-red-950/40 text-red-400",
        success: "border-emerald-900/50 bg-emerald-950/40 text-emerald-400",
        warning: "border-amber-900/50 bg-amber-950/40 text-amber-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
