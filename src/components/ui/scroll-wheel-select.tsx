
import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import * as SelectPrimitive from "@radix-ui/react-select"

const ScrollWheelSelect = SelectPrimitive.Root

const ScrollWheelSelectGroup = SelectPrimitive.Group

const ScrollWheelSelectValue = SelectPrimitive.Value

const ScrollWheelSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1 focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-slate-300/60 hover:bg-white hover:shadow-sm",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
ScrollWheelSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const ScrollWheelSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-80 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-2 max-h-72 overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent hover:scrollbar-thumb-slate-400/60",
          "scroll-smooth",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(203, 213, 225, 0.6) transparent'
        }}
      >
        <div className="space-y-1">
          {children}
        </div>
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
ScrollWheelSelectContent.displayName = SelectPrimitive.Content.displayName

const ScrollWheelSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-3 pl-3 pr-8 text-sm outline-none focus:bg-blue-50/80 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-50/80 transition-all duration-200 group",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center opacity-0 group-data-[state=checked]:opacity-100 transition-opacity duration-200">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
ScrollWheelSelectItem.displayName = SelectPrimitive.Item.displayName

export {
  ScrollWheelSelect,
  ScrollWheelSelectGroup,
  ScrollWheelSelectValue,
  ScrollWheelSelectTrigger,
  ScrollWheelSelectContent,
  ScrollWheelSelectItem,
}
