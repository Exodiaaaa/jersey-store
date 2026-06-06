import { InputHTMLAttributes, LabelHTMLAttributes, PropsWithChildren, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label({
  children,
  className = "",
  ...props
}: PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>) {
  return (
    <label className={["block text-sm font-medium text-zinc-200", className].join(" ")} {...props}>
      {children}
    </label>
  );
}

export function inputClassName(className = "") {
  return [
    "h-11 w-full rounded-lg border border-white/12 bg-zinc-950/70 px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-lime-300/60",
    className,
  ].join(" ");
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClassName(props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputClassName(props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full rounded-lg border border-white/12 bg-zinc-950/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-lime-300/60",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
