// Collapsible stub
import * as React from 'react'
export const Collapsible = ({ children, ...props }: any) => <div {...props}>{children}</div>
export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
CollapsibleTrigger.displayName = 'CollapsibleTrigger'
export const CollapsibleContent = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
CollapsibleContent.displayName = 'CollapsibleContent'
