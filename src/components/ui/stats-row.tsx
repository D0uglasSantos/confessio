import type { ReactNode } from "react"

import { cn } from "cn"

export type StatItem = {
  label: string
  value: ReactNode
  hint?: string
  emphasize?: boolean
}

export function StatsRow({
  items,
  className,
}: {
  items: StatItem[]
  className?: string
}) {
  return (
    <dl
      className={cn(
        "flex flex-wrap items-stretch gap-y-4",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "flex min-w-[7.5rem] flex-1 flex-col justify-center px-4 first:pl-0 last:pr-0 sm:min-w-[8.5rem]",
            index > 0 && "border-l border-border/70"
          )}
        >
          <dt className="text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
            {item.label}
          </dt>
          <dd
            className={cn(
              "mt-1 font-heading leading-none tabular-nums",
              item.emphasize ? "text-[1.75rem]" : "text-2xl"
            )}
          >
            {item.value}
          </dd>
          {item.hint ? (
            <p className="text-muted-foreground mt-1.5 text-xs">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  )
}
