import { cn } from "@/lib/utils";

/** Consistent flat surface (white card, soft border, subtle hover lift) used across the app. */
export function GlassCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-hover rounded-3xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3", className)}>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
