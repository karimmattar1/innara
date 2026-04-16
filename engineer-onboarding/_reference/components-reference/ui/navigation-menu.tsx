// Navigation menu stub
import * as React from 'react'
import { cn } from '@/lib/utils'
const Stub = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />)
Stub.displayName = 'NavigationMenuStub'
export const NavigationMenu = Stub
export const NavigationMenuList = Stub
export const NavigationMenuItem = Stub
export const NavigationMenuContent = Stub
export const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger'
export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <a ref={ref} {...props} />)
NavigationMenuLink.displayName = 'NavigationMenuLink'
export const NavigationMenuIndicator = Stub
export const NavigationMenuViewport = Stub
export const navigationMenuTriggerStyle = () => ''
