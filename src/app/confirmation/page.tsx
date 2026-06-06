import { Suspense } from "react";
import { ConfirmationClient } from "@/components/checkout/confirmation-client";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-2xl px-4 py-20 text-center text-zinc-400 sm:px-6">
          Préparation de la redirection WhatsApp...
        </section>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
