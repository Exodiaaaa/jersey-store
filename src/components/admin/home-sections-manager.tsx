"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, GripVertical, Plus, Save, Search, Trash2, X } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import { HomeSection, HomeSectionInput, Product } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductMedia } from "@/components/product/product-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Textarea } from "@/components/ui/field";

type PendingAction =
  | { section: HomeSectionInput; type: "add" }
  | { id: string; section: HomeSectionInput; type: "save" }
  | { section: HomeSection; type: "delete" }
  | { previousSections: HomeSection[]; sections: HomeSection[]; type: "reorder" }
  | null;

function blankDraft(sortOrder = 1): HomeSectionInput {
  return {
    isActive: true,
    productIds: [],
    sortOrder,
    subtitle: "",
    title: "",
  };
}

function sortSections(sections: HomeSection[]) {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function renumberSections(sections: HomeSection[]) {
  return sections.map((section, index) => ({ ...section, sortOrder: index + 1 }));
}

function toSectionInput(section: HomeSection): HomeSectionInput {
  return {
    id: section.id,
    isActive: section.isActive,
    productIds: section.productIds,
    sortOrder: section.sortOrder,
    subtitle: section.subtitle,
    title: section.title,
  };
}

export function HomeSectionsManager() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<HomeSectionInput>(blankDraft());
  const [searchQuery, setSearchQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const dragStartSectionsRef = useRef<HomeSection[]>([]);
  const sectionsRef = useRef<HomeSection[]>([]);
  const didDropRef = useRef(false);

  const isEditing = Boolean(draft.id);
  const nextSortOrder = Math.max(0, ...sections.map((section) => section.sortOrder)) + 1;

  useEffect(() => {
    void Promise.all([clientApi.getHomeSections(), clientApi.getProducts()])
      .then(([nextSections, nextProducts]) => {
        setSections(sortSections(nextSections));
        setProducts(nextProducts);
        setDraft(blankDraft(Math.max(0, ...nextSections.map((section) => section.sortOrder)) + 1));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [product.name, product.teamName, product.teamId, product.categoryName, product.categoryId]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [products, searchQuery]);

  const selectedProducts = useMemo(
    () =>
      draft.productIds
        .map((productId) => products.find((product) => product.id === productId))
        .filter((product): product is Product => Boolean(product)),
    [draft.productIds, products],
  );

  const updateDraft = <K extends keyof HomeSectionInput>(key: K, value: HomeSectionInput[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetDraft = () => {
    setDraft(blankDraft(nextSortOrder));
    setSearchQuery("");
    setFormError("");
  };

  const editSection = (section: HomeSection) => {
    setDraft({
      id: section.id,
      isActive: section.isActive,
      productIds: section.productIds,
      sortOrder: section.sortOrder,
      subtitle: section.subtitle ?? "",
      title: section.title,
    });
    setFormError("");
  };

  const toggleProduct = (productId: string) => {
    setDraft((current) => {
      const hasProduct = current.productIds.includes(productId);

      return {
        ...current,
        productIds: hasProduct
          ? current.productIds.filter((id) => id !== productId)
          : [...current.productIds, productId],
      };
    });
  };

  const submitSection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const currentSortOrder = draft.id
      ? sections.find((section) => section.id === draft.id)?.sortOrder ?? draft.sortOrder
      : nextSortOrder;

    const cleanDraft: HomeSectionInput = {
      ...draft,
      productIds: Array.from(new Set(draft.productIds)),
      sortOrder: currentSortOrder,
      subtitle: draft.subtitle?.trim(),
      title: draft.title.trim(),
    };

    if (!cleanDraft.title) {
      setFormError("Ajoutez un titre pour la section.");
      return;
    }

    if (cleanDraft.productIds.length === 0) {
      setFormError("Choisissez au moins un produit pour cette section.");
      return;
    }

    if (cleanDraft.id) {
      setPendingAction({ id: cleanDraft.id, section: cleanDraft, type: "save" });
      return;
    }

    setPendingAction({ section: cleanDraft, type: "add" });
  };

  const startSectionDrag = (event: DragEvent<HTMLButtonElement>, section: HomeSection) => {
    dragStartSectionsRef.current = sections;
    didDropRef.current = false;
    setDraggedSectionId(section.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", section.id);
  };

  const moveDraggedSection = (event: DragEvent<HTMLElement>, overSectionId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (!draggedSectionId || draggedSectionId === overSectionId) return;

    setSections((current) => {
      const draggedIndex = current.findIndex((section) => section.id === draggedSectionId);
      const overIndex = current.findIndex((section) => section.id === overSectionId);

      if (draggedIndex < 0 || overIndex < 0 || draggedIndex === overIndex) {
        return current;
      }

      const nextSections = [...current];
      const [draggedSection] = nextSections.splice(draggedIndex, 1);
      nextSections.splice(overIndex, 0, draggedSection);

      const renumberedSections = renumberSections(nextSections);
      sectionsRef.current = renumberedSections;
      return renumberedSections;
    });
  };

  const dropSection = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    didDropRef.current = true;
    setDraggedSectionId(null);

    const previousSections = dragStartSectionsRef.current;
    const nextSections = renumberSections(sectionsRef.current);
    if (previousSections.length === 0) return;

    const previousOrder = previousSections.map((section) => section.id).join("|");
    const nextOrder = nextSections.map((section) => section.id).join("|");

    if (previousOrder !== nextOrder) {
      setPendingAction({
        previousSections,
        sections: nextSections,
        type: "reorder",
      });
    }
  };

  const endSectionDrag = () => {
    if (!didDropRef.current && dragStartSectionsRef.current.length > 0) {
      setSections(dragStartSectionsRef.current);
    }

    setDraggedSectionId(null);
  };

  const cancelPendingAction = () => {
    if (pendingAction?.type === "reorder") {
      setSections(pendingAction.previousSections);
    }

    setPendingAction(null);
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    setIsSaving(true);
    try {
      if (pendingAction.type === "add") {
        const savedSection = await clientApi.createHomeSection(pendingAction.section);
        setSections((current) => sortSections([...current, savedSection]));
        resetDraft();
      }

      if (pendingAction.type === "save") {
        const savedSection = await clientApi.updateHomeSection(pendingAction.id, pendingAction.section);
        setSections((current) =>
          sortSections(current.map((section) => (section.id === savedSection.id ? savedSection : section))),
        );
        resetDraft();
      }

      if (pendingAction.type === "delete") {
        await clientApi.deleteHomeSection(pendingAction.section.id);
        setSections((current) => current.filter((section) => section.id !== pendingAction.section.id));
        if (draft.id === pendingAction.section.id) {
          resetDraft();
        }
      }

      if (pendingAction.type === "reorder") {
        const savedSections = await Promise.all(
          pendingAction.sections.map((section) =>
            clientApi.updateHomeSection(section.id, toSectionInput(section)),
          ),
        );
        setSections(sortSections(savedSections));
      }
    } finally {
      setIsSaving(false);
      setPendingAction(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        description="Creez les lignes de produits visibles sur la page d'accueil : Coupe du Monde 2026, maillots, ensembles ou nouvelles collections."
        title="Accueil"
      />

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5" onSubmit={submitSection}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                {isEditing ? "Modifier section" : "Nouvelle section"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{selectedProducts.length} produit(s) selectionne(s)</p>
            </div>
            {isEditing && (
              <Button onClick={resetDraft} size="icon" type="button" variant="secondary">
                <X size={17} />
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="section-title">Titre</Label>
              <Input
                id="section-title"
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="Coupe du Monde 2026"
                required
                value={draft.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-subtitle">Sous-titre</Label>
              <Textarea
                id="section-subtitle"
                onChange={(event) => updateDraft("subtitle", event.target.value)}
                placeholder="Tenues des equipes qualifiees"
                value={draft.subtitle ?? ""}
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-zinc-200">
              <input
                checked={draft.isActive}
                className="h-4 w-4 accent-amber-300"
                onChange={(event) => updateDraft("isActive", event.target.checked)}
                type="checkbox"
              />
              Section active
            </label>

            <div className="space-y-2">
              <Label htmlFor="product-search">Produits</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                <Input
                  className="pl-10"
                  id="product-search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Real Madrid, Mexique, pack..."
                  value={searchQuery}
                />
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((product) => (
                  <button
                    className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100"
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    type="button"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const checked = draft.productIds.includes(product.id);

                return (
                  <label
                    className={[
                      "grid cursor-pointer grid-cols-[64px_1fr_auto] items-center gap-3 rounded-lg border p-2 transition",
                      checked
                        ? "border-amber-300/45 bg-amber-300/10"
                        : "border-white/10 bg-zinc-950/60 hover:border-white/20",
                    ].join(" ")}
                    key={product.id}
                  >
                    <ProductMedia className="aspect-square rounded-md" images={product.images} name={product.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-white">{product.name}</span>
                      <span className="mt-1 block text-xs text-zinc-500">{formatPrice(product.basePrice)}</span>
                    </span>
                    <input
                      checked={checked}
                      className="h-4 w-4 accent-amber-300"
                      onChange={() => toggleProduct(product.id)}
                      type="checkbox"
                    />
                  </label>
                );
              })}
            </div>

            {formError && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
                {formError}
              </p>
            )}

            <Button disabled={isSaving} size="lg" type="submit">
              {isEditing ? <Save size={19} /> : <Plus size={19} />}
              {isSaving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Ajouter la section"}
            </Button>
          </div>
        </form>

        <div className="grid h-fit gap-4">
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">
            Glissez une section avec la poignee pour changer son ordre sur la page accueil.
          </div>

          {sections.map((section, index) => (
            <article
              className={[
                "rounded-lg border border-white/10 bg-white/[0.04] p-4 transition",
                draggedSectionId === section.id ? "scale-[0.99] border-amber-300/45 opacity-70" : "",
              ].join(" ")}
              key={section.id}
              onDragOver={(event) => moveDraggedSection(event, section.id)}
              onDrop={dropSection}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <button
                    aria-label={`Deplacer ${section.title}`}
                    className="mt-1 grid h-10 w-10 shrink-0 cursor-grab place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-amber-300/45 hover:text-amber-100 active:cursor-grabbing"
                    draggable
                    onDragEnd={endSectionDrag}
                    onDragStart={(event) => startSectionDrag(event, section)}
                    type="button"
                  >
                    <GripVertical size={19} />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={section.isActive ? "lime" : "silver"}>
                        {section.isActive ? "Active" : "Masquee"}
                      </Badge>
                      <Badge tone="blue">Position {index + 1}</Badge>
                      <Badge tone="silver">{section.products.length} produit(s)</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-white">{section.title}</h2>
                    {section.subtitle && <p className="mt-1 text-sm text-zinc-400">{section.subtitle}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => editSection(section)} size="icon" type="button" variant="secondary">
                    <Edit3 size={17} />
                  </Button>
                  <Button
                    onClick={() => setPendingAction({ section, type: "delete" })}
                    size="icon"
                    type="button"
                    variant="danger"
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {section.products.slice(0, 10).map((product) => (
                  <div className="min-w-0 rounded-lg border border-white/10 bg-zinc-950/50 p-2" key={product.id}>
                    <ProductMedia className="aspect-square rounded-md" images={product.images} name={product.name} />
                    <p className="mt-2 truncate text-xs font-bold text-zinc-200">{product.name}</p>
                  </div>
                ))}
              </div>
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
              : pendingAction?.type === "reorder"
                ? "Enregistrer l'ordre"
                : "Enregistrer"
        }
        description={
          pendingAction?.type === "delete"
            ? `Voulez-vous supprimer la section "${pendingAction.section.title}" de l'accueil ?`
            : pendingAction?.type === "add"
              ? `Voulez-vous ajouter la section "${pendingAction.section.title}" sur l'accueil ?`
              : pendingAction?.type === "reorder"
                ? "Voulez-vous enregistrer ce nouvel ordre des sections sur l'accueil ?"
                : pendingAction
                  ? `Voulez-vous enregistrer les modifications de "${pendingAction.section.title}" ?`
                  : ""
        }
        isOpen={Boolean(pendingAction)}
        onCancel={cancelPendingAction}
        onConfirm={confirmPendingAction}
        title={
          pendingAction?.type === "delete"
            ? "Confirmer la suppression"
            : pendingAction?.type === "add"
              ? "Confirmer l'ajout"
              : pendingAction?.type === "reorder"
                ? "Confirmer l'ordre"
                : "Confirmer la modification"
        }
        tone={pendingAction?.type === "delete" ? "danger" : "default"}
      />
    </div>
  );
}
