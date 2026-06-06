"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { teams } from "@/data/catalog";
import { clientApi } from "@/lib/client-api";
import { Team } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label } from "@/components/ui/field";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TeamsManager() {
  const [items, setItems] = useState<Team[]>(teams);
  const [draft, setDraft] = useState({ name: "", league: "", country: "", accent: "#f59e0b" });
  const [pendingAction, setPendingAction] = useState<
    | { team: Team; type: "add" }
    | { team: Team; type: "delete" }
    | { team: Team; type: "save" }
    | null
  >(null);

  useEffect(() => {
    clientApi.getTeams().then(setItems).catch(() => undefined);
  }, []);

  const addTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTeam: Team = {
      id: slugify(draft.name) || `team-${Date.now()}`,
      ...draft,
    };
    setPendingAction({ team: nextTeam, type: "add" });
  };

  const updateTeam = (id: string, patch: Partial<Team>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const saveTeam = async (team: Team) => {
    const savedTeam = await clientApi.updateTeam(team);
    setItems((current) => current.map((item) => (item.id === savedTeam.id ? savedTeam : item)));
  };

  const deleteTeam = async (team: Team) => {
    await clientApi.deleteTeam(team.id);
    setItems((current) => current.filter((item) => item.id !== team.id));
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "add") {
      const savedTeam = await clientApi.createTeam(pendingAction.team);
      setItems((current) => [...current, savedTeam]);
      setDraft({ name: "", league: "", country: "", accent: "#f59e0b" });
    }

    if (pendingAction.type === "save") {
      await saveTeam(pendingAction.team);
    }

    if (pendingAction.type === "delete") {
      await deleteTeam(pendingAction.team);
    }

    setPendingAction(null);
  };

  return (
    <div>
      <AdminPageHeader
        description="Référentiel des équipes de football utilisées pour les filtres et fiches produits."
        title="Équipes"
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5" onSubmit={addTeam}>
          <h2 className="text-xl font-black text-white">Nouvelle équipe</h2>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nom</Label>
              <Input
                id="team-name"
                onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                required
                value={draft.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-league">Championnat</Label>
              <Input
                id="team-league"
                onChange={(event) => setDraft((value) => ({ ...value, league: event.target.value }))}
                value={draft.league}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-country">Pays</Label>
              <Input
                id="team-country"
                onChange={(event) => setDraft((value) => ({ ...value, country: event.target.value }))}
                value={draft.country}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-accent">Couleur</Label>
              <Input
                className="h-11 p-1"
                id="team-accent"
                onChange={(event) => setDraft((value) => ({ ...value, accent: event.target.value }))}
                type="color"
                value={draft.accent}
              />
            </div>
            <Button type="submit">
              <Plus size={18} />
              Ajouter
            </Button>
          </div>
        </form>

        <div className="grid gap-4">
          {items.map((team) => (
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4" key={team.id}>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_90px_auto]">
                <Input aria-label="Nom équipe" onChange={(event) => updateTeam(team.id, { name: event.target.value })} value={team.name} />
                <Input
                  aria-label="Championnat"
                  onChange={(event) => updateTeam(team.id, { league: event.target.value })}
                  value={team.league}
                />
                <Input
                  aria-label="Pays"
                  onChange={(event) => updateTeam(team.id, { country: event.target.value })}
                  value={team.country}
                />
                <Input
                  aria-label="Couleur"
                  className="h-11 p-1"
                  onChange={(event) => updateTeam(team.id, { accent: event.target.value })}
                  type="color"
                  value={team.accent}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPendingAction({ team, type: "save" })}
                    size="icon"
                    type="button"
                    variant="secondary"
                  >
                    <Save size={17} />
                  </Button>
                  <Button
                    onClick={() => setPendingAction({ team, type: "delete" })}
                    size="icon"
                    type="button"
                    variant="danger"
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">ID : {team.id}</p>
            </article>
          ))}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel={
          pendingAction?.type === "delete" ? "Supprimer" : pendingAction?.type === "add" ? "Ajouter" : "Enregistrer"
        }
        description={
          pendingAction?.type === "delete"
            ? `Voulez-vous vraiment supprimer l'equipe "${pendingAction.team.name}" ?`
            : pendingAction?.type === "add"
              ? `Voulez-vous ajouter l'equipe "${pendingAction.team.name}" ?`
              : pendingAction
                ? `Voulez-vous enregistrer les modifications de l'equipe "${pendingAction.team.name}" ?`
                : ""
        }
        isOpen={Boolean(pendingAction)}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        title={
          pendingAction?.type === "delete"
            ? "Confirmer la suppression"
            : pendingAction?.type === "add"
              ? "Confirmer l'ajout"
              : "Confirmer la modification"
        }
        tone={pendingAction?.type === "delete" ? "danger" : "default"}
      />
    </div>
  );
}
