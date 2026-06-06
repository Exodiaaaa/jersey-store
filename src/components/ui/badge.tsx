import { PropsWithChildren } from "react";

type BadgeProps = {
  tone?: "lime" | "silver" | "red" | "blue";
  className?: string;
};

const tones = {
  lime: "border-amber-300/35 bg-amber-300/12 text-amber-100",
  silver: "border-cyan-100/15 bg-cyan-100/10 text-zinc-200",
  red: "border-red-300/30 bg-red-400/12 text-red-100",
  blue: "border-cyan-300/30 bg-cyan-300/12 text-cyan-100",
};

export function Badge({ children, tone = "silver", className = "" }: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
