import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("max-w-7xl mx-auto space-y-4 sm:space-y-6", className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

const accentMap = {
  blue: "accent-strip-blue",
  green: "accent-strip-green",
  amber: "accent-strip-amber",
  red: "accent-strip-red",
  purple: "accent-strip-purple",
} as const;

export function StatCard({
  label,
  value,
  icon,
  accent,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent: keyof typeof accentMap;
  trend?: number | null;
  className?: string;
}) {
  return (
    <div className={cn(`${accentMap[accent]} rounded-2xl p-5 animate-fade-up`, className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl md:text-3xl font-extrabold text-foreground min-w-0 break-words">
          {value}
        </div>
        {icon && <div className="text-foreground/60 mt-1 shrink-0">{icon}</div>}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 font-semibold truncate">{label}</div>
      {trend !== undefined && trend !== null && (
        <div
          className={cn(
            "text-[11px] mt-2 inline-flex items-center gap-1",
            trend >= 0 ? "text-[oklch(0.4_0.12_152)]" : "text-destructive",
          )}
        >
          {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(trend)} vs last period
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  className,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      {icon && <div className="mx-auto w-12 h-12 mb-3 text-muted-foreground/40">{icon}</div>}
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
    </div>
  );
}
