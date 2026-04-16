// Menubar stub
import * as React from 'react'
const Stub = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
Stub.displayName = 'MenubarStub'
export const Menubar = Stub
export const MenubarMenu = ({ children }: any) => <>{children}</>
export const MenubarTrigger = Stub
export const MenubarContent = Stub
export const MenubarItem = Stub
export const MenubarSeparator = Stub
export const MenubarLabel = Stub
export const MenubarCheckboxItem = Stub
export const MenubarRadioGroup = Stub
export const MenubarRadioItem = Stub
export const MenubarPortal = ({ children }: any) => <>{children}</>
export const MenubarSub = ({ children }: any) => <>{children}</>
export const MenubarSubContent = Stub
export const MenubarSubTrigger = Stub
export const MenubarGroup = Stub
export const MenubarShortcut = Stub
