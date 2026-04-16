// Radio group stub
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Circle } from 'lucide-react'

const RadioGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void }>(({ className, ...props }, ref) => <div ref={ref} className={cn('grid gap-2', className)} role='radiogroup' {...props} />)
RadioGroup.displayName = 'RadioGroup'
const RadioGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(({ className, ...props }, ref) => <button ref={ref} className={cn('aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}><Circle className='h-3.5 w-3.5 fill-primary' /></button>)
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
