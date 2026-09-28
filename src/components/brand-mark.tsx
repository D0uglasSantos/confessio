import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

function brandSrc({
  compact,
  lockup,
  onDark,
}: {
  compact: boolean;
  lockup: boolean;
  onDark: boolean;
}) {
  if (compact) {
    return onDark
      ? "/brand/confessio/icons/confessio-symbol-light.svg"
      : "/brand/confessio/icons/confessio-symbol.svg";
  }

  const tone = onDark ? "light" : "dark";
  const variant = lockup ? "with-tagline" : "no-tagline";
  return `/brand/confessio/logos/confessio-horizontal-${tone}-${variant}.svg`;
}

export function BrandMark({
  className,
  compact = false,
  tagline = false,
  lockup = false,
  onDark = false,
}: {
  className?: string;
  compact?: boolean;
  tagline?: boolean;
  lockup?: boolean;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        tagline && !compact ? "flex-col items-start gap-1.5" : null,
        className,
      )}
    >
      {/* Official SVGs; img keeps vector quality in print and PWA. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandSrc({ compact, lockup, onDark })}
        alt={APP_NAME}
        className={cn(
          "object-contain object-left",
          compact
            ? "size-10"
            : lockup
              ? "h-16 w-auto max-w-[22rem] sm:h-20"
              : "h-9 w-auto max-w-[11.5rem] sm:h-10 sm:max-w-[13.5rem]",
        )}
      />
      {tagline && !compact ? (
        <span className="text-muted-foreground max-w-[18rem] text-xs leading-5 font-normal tracking-normal">
          {APP_TAGLINE}
        </span>
      ) : null}
    </span>
  );
}
