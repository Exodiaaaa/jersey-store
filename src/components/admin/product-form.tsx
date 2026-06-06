"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { categories, sizes, teams } from "@/data/catalog";
import { clientApi } from "@/lib/client-api";
import { Category, Product, ProductCategoryId, ProductVisual, Size, StockBySize, Team } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { Button, LinkButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/field";

type ProductFormProps = {
  productId?: string;
};

const defaultStock: StockBySize = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 };

const defaultVisual: ProductVisual = {
  primary: "#f8fafc",
  secondary: "#111111",
  trim: "#c7c7c7",
  pattern: "clean",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createBlankProduct(categoryItems: Category[], teamItems: Team[], sizeItems: Size[]): Product {
  return {
    id: `prod-${Date.now()}`,
    slug: "",
    name: "",
    teamId: teamItems[0]?.id ?? "team",
    categoryId: categoryItems[0]?.id ?? "jersey",
    basePrice: 249,
    packPrice: 329,
    flockingPrice: 39,
    description: "",
    sizes: sizeItems,
    stock: defaultStock,
    images: [],
    visual: defaultVisual,
    isNew: true,
    isPopular: false,
    allowFlocking: true,
    createdAt: new Date().toISOString(),
  };
}

export function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const [categoryItems, setCategoryItems] = useState<Category[]>(categories);
  const [teamItems, setTeamItems] = useState<Team[]>(teams);
  const sizeItems = sizes;
  const [product, setProduct] = useState<Product>(() => createBlankProduct(categories, teams, sizes));
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [productToSave, setProductToSave] = useState<Product | null>(null);

  const isEditing = Boolean(productId);

  useEffect(() => {
    void Promise.all([clientApi.getCategories(), clientApi.getTeams()]).then(
      ([nextCategories, nextTeams]) => {
        setCategoryItems(nextCategories);
        setTeamItems(nextTeams);
        if (!productId) {
          setProduct((current) => ({
            ...current,
            categoryId: nextCategories[0]?.id ?? current.categoryId,
            teamId: nextTeams[0]?.id ?? current.teamId,
          }));
        }
      },
    ).catch(() => undefined);
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    clientApi
      .getProduct(productId)
      .then((nextProduct) => {
        setProduct({
          ...nextProduct,
          stock: { ...defaultStock, ...nextProduct.stock },
        });
      })
      .catch(() => undefined);
  }, [productId]);

  const updateProduct = <K extends keyof Product>(key: K, value: Product[K]) => {
    setProduct((current) => ({ ...current, [key]: value }));
  };

  const updateStock = (size: Size, value: number) => {
    setProduct((current) => ({
      ...current,
      stock: { ...current.stock, [size]: Math.max(0, value) },
    }));
  };

  const toggleSize = (size: Size) => {
    setProduct((current) => {
      const isActive = current.sizes.includes(size);
      const nextSizes = isActive
        ? current.sizes.filter((item) => item !== size)
        : sizeItems.filter((item) => item === size || current.sizes.includes(item));

      return {
        ...current,
        sizes: nextSizes,
        stock: {
          ...current.stock,
          [size]: isActive ? 0 : current.stock[size],
        },
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (product.sizes.length === 0) {
      setFormError("Choisissez au moins une taille disponible pour ce produit.");
      return;
    }

    const cleanProduct = {
      ...product,
      slug: product.slug || slugify(product.name),
    };

    setProductToSave(cleanProduct);
  };

  const confirmSaveProduct = async () => {
    if (!productToSave) return;

    setIsSaving(true);
    try {
      if (isEditing) {
        await clientApi.updateProduct(productToSave);
      } else {
        await clientApi.createProduct(productToSave);
      }
      router.push("/admin/produits");
    } finally {
      setIsSaving(false);
      setProductToSave(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        action={
          <LinkButton href="/admin/produits" variant="secondary">
            Retour
          </LinkButton>
        }
        description="Ajoutez les photos, les prix et le stock du produit."
        title={isEditing ? "Modifier produit" : "Ajouter produit"}
      />

      <form
        className="mx-auto grid w-full max-w-3xl gap-5 rounded-lg border border-white/10 bg-white/[0.04] p-5"
        onSubmit={handleSubmit}
      >
        <ProductImageUploader images={product.images} onChange={(images) => updateProduct("images", images)} />

        <div className="space-y-2">
          <Label htmlFor="name">Nom du produit</Label>
          <Input
            id="name"
            onChange={(event) => updateProduct("name", event.target.value)}
            placeholder="Maillot Real Madrid Home 2026"
            required
            value={product.name}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team">Equipe</Label>
            <Select id="team" onChange={(event) => updateProduct("teamId", event.target.value)} value={product.teamId}>
              {teamItems.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categorie</Label>
            <Select
              id="category"
              onChange={(event) => updateProduct("categoryId", event.target.value as ProductCategoryId)}
              value={product.categoryId}
            >
              {categoryItems.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            onChange={(event) => updateProduct("description", event.target.value)}
            required
            value={product.description}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="basePrice">Prix maillot</Label>
            <Input
              id="basePrice"
              min={0}
              onChange={(event) => updateProduct("basePrice", Number(event.target.value))}
              required
              type="number"
              value={product.basePrice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packPrice">Prix pack</Label>
            <Input
              id="packPrice"
              min={0}
              onChange={(event) => updateProduct("packPrice", Number(event.target.value))}
              required
              type="number"
              value={product.packPrice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flockingPrice">Prix flocage</Label>
            <Input
              id="flockingPrice"
              min={0}
              onChange={(event) => updateProduct("flockingPrice", Number(event.target.value))}
              type="number"
              value={product.flockingPrice}
            />
          </div>
        </div>

        <div>
          <Label>Tailles disponibles et stock</Label>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sizeItems.map((size) => {
              const isActive = product.sizes.includes(size);

              return (
                <div
                  className={[
                    "space-y-3 rounded-lg border p-3 transition",
                    isActive
                      ? "border-lime-300/50 bg-lime-300/10"
                      : "border-white/10 bg-zinc-950/60 opacity-70",
                  ].join(" ")}
                  key={size}
                >
                  <label className="flex items-center gap-2 text-sm font-bold text-white">
                    <input
                      checked={isActive}
                      className="h-4 w-4 accent-lime-300"
                      onChange={() => toggleSize(size)}
                      type="checkbox"
                    />
                    {size}
                  </label>
                  <Input
                    id={`stock-${size}`}
                    disabled={!isActive}
                    min={0}
                    onChange={(event) => updateStock(size, Number(event.target.value))}
                    type="number"
                    value={product.stock[size] ?? 0}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {formError && (
          <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
            {formError}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["allowFlocking", "Flocage"],
            ["isNew", "Nouveau"],
            ["isPopular", "Populaire"],
          ].map(([key, label]) => (
            <label
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-zinc-200"
              key={key}
            >
              <input
                checked={Boolean(product[key as keyof Product])}
                className="h-4 w-4 accent-lime-300"
                onChange={(event) => updateProduct(key as keyof Product, event.target.checked as never)}
                type="checkbox"
              />
              {label}
            </label>
          ))}
        </div>

        <Button disabled={isSaving} size="lg" type="submit">
          <Save size={19} />
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
      <ConfirmDialog
        confirmLabel={isEditing ? "Enregistrer" : "Ajouter"}
        description={
          productToSave
            ? isEditing
              ? `Voulez-vous enregistrer les modifications de "${productToSave.name}" ?`
              : `Voulez-vous ajouter le produit "${productToSave.name}" au catalogue ?`
            : ""
        }
        isOpen={Boolean(productToSave)}
        onCancel={() => setProductToSave(null)}
        onConfirm={confirmSaveProduct}
        title={isEditing ? "Confirmer la modification" : "Confirmer l'ajout"}
      />
    </div>
  );
}
