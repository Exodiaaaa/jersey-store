import { PropsWithChildren, ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  action,
  children,
}: PropsWithChildren<AdminPageHeaderProps>) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase text-amber-200">Back office</p>
        <h1 className="mt-2 text-3xl font-black text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}
