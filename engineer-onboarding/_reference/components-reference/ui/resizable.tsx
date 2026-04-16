// Resizable stub
import * as React from 'react'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

const ResizablePanelGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement> & { direction?: string }) => <div className={cn('flex h-full w-full', className)} {...props} />
const ResizablePanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { defaultSize?: number; minSize?: number; maxSize?: number }>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex-1', className)} {...props} />)
ResizablePanel.displayName = 'ResizablePanel'
const ResizableHandle = ({ className, withHandle, ...props }: React.HTMLAttributes<HTMLDivElement> & { withHandle?: boolean }) => <div className={cn('relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', className)} {...props}>{withHandle && <div className='z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border'><GripVertical className='h-2.5 w-2.5' /></div>}</div>

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
