import * as React from "react"

import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
      {...props}
    />
  )
)
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
)
InputGroupInput.displayName = "InputGroupInput"

type InputGroupAddonProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "inline-start" | "inline-end"
}

const InputGroupAddon = ({ align = "inline-start", className, ...props }: InputGroupAddonProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center px-3 text-sm text-muted-foreground",
      align === "inline-end" && "ml-auto",
      className
    )}
    {...props}
  />
)
InputGroupAddon.displayName = "InputGroupAddon"

export { InputGroup, InputGroupAddon, InputGroupInput }
