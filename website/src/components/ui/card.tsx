import { cn } from "../../lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-2/80 shadow-soft backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
