import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type HTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export const NeuCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    variant?: "raised" | "inset" | "sm" | "lg" | "yellow" | "orange" | "pink";
  }
>(({ className, variant = "raised", ...rest }, ref) => {
  const v =
    variant === "inset"
      ? "neu-inset"
      : variant === "sm"
        ? "neu-raised-sm"
        : variant === "lg"
          ? "neu-raised-lg"
          : variant === "yellow"
            ? "brutal-card-yellow"
            : variant === "orange"
              ? "brutal-card-orange"
              : variant === "pink"
                ? "brutal-card-pink"
                : "brutal-card";
  return <div ref={ref} className={cn(v, "p-5", className)} {...rest} />;
});
NeuCard.displayName = "NeuCard";

export const NeuButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md";
  }
>(({ className, variant = "secondary", size = "md", ...rest }, ref) => {
  const sizes = size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  const variants =
    variant === "primary"
      ? "brutal-btn"
      : variant === "ghost"
        ? "bg-transparent text-foreground hover:underline font-bold uppercase tracking-wide"
        : "brutal-btn-secondary";
  return (
    <button
      ref={ref}
      className={cn(sizes, variants, "disabled:opacity-50 disabled:cursor-not-allowed", className)}
      {...rest}
    />
  );
});
NeuButton.displayName = "NeuButton";

export const NeuInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "neu-input px-4 py-2.5 text-sm w-full placeholder:text-[rgba(10,10,10,0.5)]",
        className,
      )}
      {...rest}
    />
  ),
);
NeuInput.displayName = "NeuInput";

export const NeuTextarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "neu-input px-4 py-3 text-sm w-full placeholder:text-[rgba(10,10,10,0.5)] resize-none",
      className,
    )}
    {...rest}
  />
));
NeuTextarea.displayName = "NeuTextarea";

export const NeuSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn("neu-input px-3 py-2 text-sm appearance-none cursor-pointer", className)}
      {...rest}
    >
      {children}
    </select>
  ),
);
NeuSelect.displayName = "NeuSelect";

export function NeuBadge({
  children,
  color = "muted",
  className,
}: {
  children: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red" | "purple" | "muted";
  className?: string;
}) {
  const styles: Record<string, string> = {
    blue: "bg-[var(--brand-pink)] text-white",
    green: "bg-[var(--success)] text-black",
    amber: "bg-[var(--brand-yellow)] text-black",
    red: "bg-[var(--destructive)] text-white",
    purple: "bg-[var(--brand-pink)] text-white",
    muted: "bg-white text-black",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[12px] font-extrabold border-2 border-black",
        styles[color],
        className,
      )}
      style={{ boxShadow: "0 3px 0 #0A0A0A" }}
    >
      {children}
    </span>
  );
}
