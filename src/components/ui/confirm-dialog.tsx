"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "default";
};

export function ConfirmDialog({
  cancelLabel = "Annuler",
  confirmLabel = "Confirmer",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#060607] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-lg border",
              tone === "danger"
                ? "border-red-400/35 bg-red-500/12 text-red-100"
                : "border-[#d9dde2]/35 bg-white/10 text-[#f5f7f9]",
            ].join(" ")}
          >
            <AlertTriangle size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onCancel} type="button" variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} type="button" variant={tone === "danger" ? "danger" : "primary"}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
