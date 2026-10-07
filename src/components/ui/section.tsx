import type { ReactNode } from "react"

import { cn } from "cn"

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || action ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-heading text-xl leading-7 tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}
