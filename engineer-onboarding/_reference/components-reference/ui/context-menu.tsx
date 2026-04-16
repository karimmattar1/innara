// Context menu stub
import * as React from 'react'
const Stub = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
Stub.displayName = 'ContextMenuStub'
export const ContextMenu = ({ children }: any) => <>{children}</>
export const ContextMenuTrigger = Stub
export const ContextMenuContent = Stub
export const ContextMenuItem = Stub
export const ContextMenuCheckboxItem = Stub
export const ContextMenuRadioItem = Stub
export const ContextMenuLabel = Stub
export const ContextMenuSeparator = Stub
export const ContextMenuShortcut = Stub
export const ContextMenuGroup = Stub
export const ContextMenuPortal = ({ children }: any) => <>{children}</>
export const ContextMenuSub = ({ children }: any) => <>{children}</>
export const ContextMenuSubContent = Stub
export const ContextMenuSubTrigger = Stub
export const ContextMenuRadioGroup = Stub
