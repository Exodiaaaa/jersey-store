"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { changeAdminPassword } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

type ChangePasswordDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChangePasswordDialog({ isOpen, onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) {
    return null;
  }

  const close = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setIsSubmitting(false);
    setIsSuccess(false);
    onClose();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    setIsSubmitting(true);
    const response = await changeAdminPassword(currentPassword, newPassword, confirmPassword).catch(() => null);
    setIsSubmitting(false);

    if (!response?.ok) {
      const body = (await response?.json().catch(() => null)) as { message?: string } | null;
      setError(body?.message ?? "Modification impossible. Reessayez.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSuccess(true);
  };

  return (
    <div
      aria-labelledby="change-password-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 backdrop-blur-sm"
      role="dialog"
    >
      <form className="w-full max-w-md rounded-lg border border-white/10 bg-[#060607] p-5 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#d9dde2]/35 bg-white/10 text-[#f5f7f9]">
            <KeyRound size={22} />
          </span>
          <div>
            <h2 className="text-lg font-black text-white" id="change-password-title">
              Changer le mot de passe
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Le nouveau mot de passe doit contenir au moins 12 caracteres, une lettre et un chiffre.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="mt-6">
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Mot de passe modifie. Les autres sessions administrateur ont ete invalidees.
            </p>
            <Button className="mt-5 w-full" onClick={close} type="button">
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4">
              <PasswordField
                autoComplete="current-password"
                id="current-password"
                label="Mot de passe actuel"
                onChange={setCurrentPassword}
                value={currentPassword}
              />
              <PasswordField
                autoComplete="new-password"
                id="new-password"
                label="Nouveau mot de passe"
                minLength={12}
                onChange={setNewPassword}
                value={newPassword}
              />
              <PasswordField
                autoComplete="new-password"
                id="confirm-password"
                label="Confirmer le nouveau mot de passe"
                minLength={12}
                onChange={setConfirmPassword}
                value={confirmPassword}
              />
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button disabled={isSubmitting} onClick={close} type="button" variant="secondary">
                Annuler
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Modification..." : "Enregistrer"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

type PasswordFieldProps = {
  autoComplete: string;
  id: string;
  label: string;
  minLength?: number;
  onChange: (value: string) => void;
  value: string;
};

function PasswordField({ autoComplete, id, label, minLength, onChange, value }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
        <Input
          autoComplete={autoComplete}
          className="pl-10"
          id={id}
          minLength={minLength}
          onChange={(event) => onChange(event.target.value)}
          required
          type="password"
          value={value}
        />
      </div>
    </div>
  );
}
