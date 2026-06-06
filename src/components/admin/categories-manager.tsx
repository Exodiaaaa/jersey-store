"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { categories } from "@/data/catalog";
import { clientApi } from "@/lib/client-api";
import { Category } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Textarea } from "@/components/ui/field";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoriesManager() {
  const [items, setItems] = useState<Category[]>(categories);
  const [draft, setDraft] = useState({ name: "", description: "" });
  const [pendingAction, setPendingAction] = useState<
    | { category: Category; type: "add" }
    | { category: Category; type: "delete" }
    | { category: Category; type: "save" }
    | null
  >(null);

  useEffect(() => {
    clientApi.getCategories().then(setItems).catch(() => undefined);
  }, []);

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCategory: Category = {
      id: slugify(draft.name) || `categorie-${Date.now()}`,
      name: draft.name,
      description: draft.description,
    };
    setPendingAction({ category: nextCategory, type: "add" });
  };

  const updateCategory = (id: string, patch: Partial<Category>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const saveCategory = async (category: Category) => {
    const savedCategory = await clientApi.updateCategory(category);
    setItems((current) => current.map((item) => (item.id === savedCategory.id ? savedCategory : item)));
  };

  const deleteCategory = async (category: Category) => {
    await clientApi.deleteCategory(category.id);
    setItems((current) => current.filter((item) => item.id !== category.id));
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "add") {
      const savedCategory = await clientApi.createCategory(pendingAction.category);
      setItems((current) => [...current, savedCategory]);
      setDraft({ name: "", description: "" });
    }

    if (pendingAction.type === "save") {
      await saveCategory(pendingAction.category);
    }

    if (pendingAction.type === "delete") {
      await deleteCategory(pendingAction.category);
    }

    setPendingAction(null);
  };

  return (
    <div>
      <AdminPageHeader
        description="Catégories utilisées dans le catalogue : maillot seul, pack, accessoires ou autres familles."
        title="Catégories"
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5" onSubmit={addCategory}>
          <h2 className="text-xl font-black text-white">Nouvelle catégorie</h2>
          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nom</Label>
              <Input
                id="category-name"
                onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                required
                value={draft.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                value={draft.description}
              />
            </div>
            <Button type="submit">
              <Plus size={18} />
              Ajouter
            </Button>
          </div>
        </form>

        <div className="grid gap-4">
          {items.map((category) => (
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4" key={category.id}>
              <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
                <Input
                  aria-label="Nom catégorie"
                  onChange={(event) => updateCategory(category.id, { name: event.target.value })}
                  value={category.name}
                />
                <Input
                  aria-label="Description catégorie"
                  onChange={(event) => updateCategory(category.id, { description: event.target.value })}
                  value={category.description}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPendingAction({ category, type: "save" })}
                    size="icon"
                    type="button"
                    variant="secondary"
                  >
                    <Save size={17} />
                  </Button>
                  <Button
                    onClick={() => setPendingAction({ category, type: "delete" })}
                    size="icon"
                    type="button"
                    variant="danger"
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">ID : {category.id}</p>
            </article>
          ))}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel={
          pendingAction?.type === "delete"
            ? "Supprimer"
            : pendingAction?.type === "add"
              ? "Ajouter"
              : "Enregistrer"
        }
        description={
          pendingAction?.type === "delete"
            ? `Voulez-vous vraiment supprimer la categorie "${pendingAction.category.name}" ?`
            : pendingAction?.type === "add"
              ? `Voulez-vous ajouter la categorie "${pendingAction.category.name}" ?`
              : pendingAction
                ? `Voulez-vous enregistrer les modifications de la categorie "${pendingAction.category.name}" ?`
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
