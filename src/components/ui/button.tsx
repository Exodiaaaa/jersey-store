import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime-300 text-zinc-950 shadow-[0_0_26px_rgba(190,242,100,0.18)] hover:bg-lime-200 focus-visible:outline-lime-300",
  secondary:
    "border border-white/15 bg-white/8 text-white hover:border-white/25 hover:bg-white/12 focus-visible:outline-white/40",
  ghost: "text-zinc-200 hover:bg-white/8 focus-visible:outline-white/40",
  danger:
    "border border-red-400/35 bg-red-500/12 text-red-100 hover:bg-red-500/18 focus-visible:outline-red-300",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export function buttonClassName(variant: Variant = "primary", size: Size = "md", className = "") {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button className={buttonClassName(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
};

export function LinkButton({
  children,
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: PropsWithChildren<LinkButtonProps>) {
  return (
    <Link className={buttonClassName(variant, size, className)} href={href} {...props}>
      {children}
    </Link>
  );
}
