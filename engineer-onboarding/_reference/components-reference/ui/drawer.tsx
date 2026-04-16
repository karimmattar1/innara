// Drawer stub
import * as React from 'react'
export const Drawer = ({ children }: any) => <>{children}</>
export const DrawerTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
DrawerTrigger.displayName = 'DrawerTrigger'
export const DrawerContent = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
DrawerContent.displayName = 'DrawerContent'
export const DrawerHeader = (props: any) => <div {...props} />
export const DrawerFooter = (props: any) => <div {...props} />
export const DrawerTitle = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
DrawerTitle.displayName = 'DrawerTitle'
export const DrawerDescription = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
DrawerDescription.displayName = 'DrawerDescription'
export const DrawerClose = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
DrawerClose.displayName = 'DrawerClose'
export const DrawerOverlay = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
DrawerOverlay.displayName = 'DrawerOverlay'
