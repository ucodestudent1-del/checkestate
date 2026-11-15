import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white",
    secondary: "bg-slate-100 text-slate-700",
    destructive: "bg-red-600 text-white",
    outline: "border border-slate-200 bg-transparent text-slate-600",
  };
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none transition-colors",
        variants[variant ?? "default"],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";
