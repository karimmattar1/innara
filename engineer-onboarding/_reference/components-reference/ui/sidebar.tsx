// Sidebar stub
import * as React from 'react'
import { cn } from '@/lib/utils'

const SidebarContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: true, setOpen: () => {} })
export function useSidebar() { return React.useContext(SidebarContext) }
export const SidebarProvider = ({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) => { const [open, setOpen] = React.useState(defaultOpen); return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider> }
export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { side?: string; variant?: string; collapsible?: string }>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex h-full w-64 flex-col', className)} {...props} />)
Sidebar.displayName = 'Sidebar'
export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex-1 overflow-auto', className)} {...props} />)
SidebarContent.displayName = 'SidebarContent'
export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => <div ref={ref} {...props} />)
SidebarGroup.displayName = 'SidebarGroup'
export const SidebarGroupContent = SidebarGroup
export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('px-2 text-xs font-semibold', className)} {...props} />)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'
export const SidebarHeader = SidebarGroup
export const SidebarFooter = SidebarGroup
export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>((props, ref) => <ul ref={ref} {...props} />)
SidebarMenu.displayName = 'SidebarMenu'
export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>((props, ref) => <li ref={ref} {...props} />)
SidebarMenuItem.displayName = 'SidebarMenuItem'
export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; isActive?: boolean; tooltip?: string }>(({ className, ...props }, ref) => <button ref={ref} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm', className)} {...props} />)
SidebarMenuButton.displayName = 'SidebarMenuButton'
export const SidebarMenuSub = SidebarMenu
export const SidebarMenuSubItem = SidebarMenuItem
export const SidebarMenuSubButton = SidebarMenuButton
export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => <div ref={ref} {...props} />)
SidebarInset.displayName = 'SidebarInset'
export const SidebarRail = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button ref={ref} {...props} />)
SidebarRail.displayName = 'SidebarRail'
export const SidebarTrigger = SidebarRail
export const SidebarInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input ref={ref} {...props} />)
SidebarInput.displayName = 'SidebarInput'
export const SidebarSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('h-px bg-border my-2', className)} {...props} />)
SidebarSeparator.displayName = 'SidebarSeparator'
