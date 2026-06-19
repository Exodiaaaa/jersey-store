import { PropsWithChildren } from "react";

type BadgeProps = {
  tone?: "lime" | "silver" | "red" | "blue";
  className?: string;
};

const tones = {
  lime: "border-[#d7ff45]/40 bg-[#d7ff45]/12 text-[#ecff9c]",
  silver: "border-white/15 bg-white/10 text-zinc-200",
  red: "border-red-300/30 bg-red-400/12 text-red-100",
  blue: "border-sky-300/30 bg-sky-300/12 text-sky-100",
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
