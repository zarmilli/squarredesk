import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type PopoverSelectOption = {
  value: string
  label: string
}

type PopoverSelectProps = {
  id?: string
  'aria-label'?: string
  value: string
  onChange: (value: string) => void
  options: PopoverSelectOption[]
  className?: string
}

export function PopoverSelect({
  id,
  'aria-label': ariaLabel,
  value,
  onChange,
  options,
  className,
}: PopoverSelectProps) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(
            'h-9 justify-between gap-2 rounded-md px-3 text-sm font-normal',
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label ?? options[0]?.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
      >
        <div className="space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {option.label}
              <Check
                aria-hidden="true"
                className={`h-4 w-4 ${option.value === value ? 'opacity-100' : 'opacity-0'}`}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
