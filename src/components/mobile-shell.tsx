import { cn } from "@/lib/utils";

/**
 * Shell mobile-first para fiel e padre (safe areas + altura útil do celular).
 */
export function MobileShell({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "urgent";
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6",
        tone === "urgent" &&
          "bg-primary text-primary-foreground [&_[data-slot=badge]]:border-primary-foreground/20",
        className,
      )}
    >
      {children}
    </main>
  );
}
