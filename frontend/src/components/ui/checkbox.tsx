import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, onFocus, ...props }, ref) => {
  const focusRef = React.useRef<HTMLButtonElement>(null);
  const mergedRef = (el: HTMLButtonElement | null) => {
    (focusRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
  };
  return (
  <CheckboxPrimitive.Root
    ref={mergedRef}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    onFocus={(e) => {
      onFocus?.(e);
      if ((e.target as HTMLElement).getAttribute('data-prevent-scroll-on-focus') === 'true') {
        (e.target as HTMLElement).blur();
      }
    }}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current leading-none")}>
      <Check className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
