import type { ReactNode } from "react"

import { cn } from "cn"

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 py-8 text-left",
        className
      )}
    >
      <p className="font-heading text-lg">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  )
}
