"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn, Mail } from "lucide-react";
import { loginAdmin } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!loginAdmin(email, password)) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    router.push("/admin/dashboard");
  };

  return (
    <section className="grid min-h-screen place-items-center bg-black px-4 py-10">
      <form className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6" onSubmit={handleSubmit}>
        <Logo />
        <div className="mt-8">
          <h1 className="text-3xl font-black text-white">Connexion admin</h1>
          <p className="mt-2 text-sm text-zinc-400">Acces vendeur pour gerer produits, commandes et stock.</p>
        </div>
        <div className="mt-6 grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <Input
                className="pl-10"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <Input
                className="pl-10"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </div>
        </div>
        {error && <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        <Button className="mt-6 w-full" size="lg" type="submit">
          <LogIn size={19} />
          Se connecter
        </Button>
      </form>
    </section>
  );
}
