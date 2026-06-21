"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { getAvailableProductTypes, getProductPriceInfo, getProductTeamName, getUnitPrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { FlockingMode, Product, ProductType, Size } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { ProductMedia } from "@/components/product/product-media";
import { ProductReviews } from "@/components/product/product-reviews";

type ProductDetailClientProps = {
  product: Product;
};

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const availableTypes = getAvailableProductTypes(product);
  const firstAvailableSize =
    product.sizes.find((item) => (product.stock[item] ?? 0) > 0) ?? product.sizes[0] ?? "S";
  const [size, setSize] = useState<Size>(firstAvailableSize);
  const [type, setType] = useState<ProductType>(availableTypes[0]);
  const [quantity, setQuantity] = useState(1);
  const [flockingMode, setFlockingMode] = useState<FlockingMode>("none");
  const [flockingName, setFlockingName] = useState("");
  const [flockingNumber, setFlockingNumber] = useState("");
  const [flockingNote, setFlockingNote] = useState("");
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.images[0] ?? "");
  const { addItem } = useCart();

  const hasFlocking = flockingMode !== "none";
  const unitPrice = useMemo(() => getUnitPrice(product, type, hasFlocking), [hasFlocking, product, type]);
  const total = unitPrice * quantity;
  const maxStock = product.stock[size] ?? 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addItem({
      product,
      size,
      type,
      quantity,
      flocking: {
        mode: flockingMode,
        name: flockingMode === "custom" ? flockingName : undefined,
        number: flockingMode !== "none" ? flockingNumber : undefined,
        note: flockingNote || undefined,
      },
    });
    setAdded(true);
  };

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="kvn-reveal lg:sticky lg:top-28 lg:self-start">
          <ProductMedia image={selectedImage} images={product.images} name={product.name} visual={product.visual} />
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  aria-label={`Voir photo ${index + 1}`}
                  className={[
                    "aspect-square rounded-lg border bg-cover bg-center transition",
                    image === selectedImage ? "border-[#d9dde2]" : "border-white/10 hover:border-white/30",
                  ].join(" ")}
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(image)}
                  style={{ backgroundImage: `url("${image.replace(/"/g, "%22")}")` }}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>
        <form className="kvn-reveal kvn-reveal-delay-1 space-y-7" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="lime">{getProductTeamName(product)}</Badge>
            {product.isNew && <Badge tone="blue">Nouveau</Badge>}
            {product.isPopular && <Badge tone="silver">Populaire</Badge>}
          </div>
          <h1 className="text-3xl font-black text-white sm:text-5xl">{product.name}</h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-400">{product.description}</p>
        </div>

        <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <div className="space-y-3">
            <Label>Taille</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {product.sizes.map((item) => {
                const disabled = product.stock[item] === 0;
                return (
                  <button
                    className={[
                      "relative h-11 overflow-hidden rounded-lg border text-sm font-bold transition",
                      item === size
                        ? "border-[#d9dde2] bg-[#d9dde2] text-[#060607]"
                        : "border-white/10 bg-[#060607] text-zinc-200 hover:border-white/25",
                      disabled ? "cursor-not-allowed opacity-50" : "",
                    ].join(" ")}
                    disabled={disabled}
                    key={item}
                    onClick={() => setSize(item)}
                    type="button"
                  >
                    <span className="relative z-10">{item}</span>
                    {disabled && (
                      <span
                        aria-hidden="true"
                        className="absolute left-2 right-2 top-1/2 h-0.5 -rotate-12 bg-white/75"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Type d’article</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {availableTypes.map((item) => {
                const priceInfo = getProductPriceInfo(product, item);

                return (
                  <button
                    className={[
                      "rounded-lg border p-3 text-left transition",
                      item === type
                        ? "border-[#d9dde2] bg-[#d9dde2] text-[#060607]"
                        : "border-white/10 bg-[#060607] text-zinc-200 hover:border-white/25",
                    ].join(" ")}
                    key={item}
                    onClick={() => setType(item)}
                    type="button"
                  >
                    <span className="block text-sm font-bold">
                      {item === "pack" ? "Maillot + short" : "Maillot seul"}
                    </span>
                    {priceInfo.originalPrice && (
                      <span className="mt-1 block text-xs font-semibold opacity-60 line-through">
                        {formatPrice(priceInfo.originalPrice)}
                      </span>
                    )}
                    <span className="block text-sm font-black">{formatPrice(priceInfo.currentPrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {product.allowFlocking && (
            <div className="space-y-3">
              <Label>Flocage</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["none", "Sans flocage"],
                  ["custom", "Avec flocage"],
                ].map(([value, label]) => (
                  <button
                    className={[
                      "h-11 rounded-lg border px-3 text-sm font-bold transition",
                      flockingMode === value
                        ? "border-[#d9dde2] bg-[#d9dde2] text-[#060607]"
                        : "border-white/10 bg-[#060607] text-zinc-200 hover:border-white/25",
                    ].join(" ")}
                    key={value}
                    onClick={() => setFlockingMode(value as FlockingMode)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {flockingMode !== "none" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="flocking-name">Nom / joueur</Label>
                    <Input
                      id="flocking-name"
                      onChange={(event) => setFlockingName(event.target.value)}
                      placeholder="Bellingham"
                      required
                      value={flockingName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flocking-number">Numéro</Label>
                    <Input
                      id="flocking-number"
                      inputMode="numeric"
                      maxLength={2}
                      onChange={(event) => setFlockingNumber(event.target.value)}
                      placeholder="5"
                      required
                      value={flockingNumber}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="flocking-note">Remarque spéciale</Label>
                    <Textarea
                      id="flocking-note"
                      onChange={(event) => setFlockingNote(event.target.value)}
                      placeholder="Police, couleur ou détail souhaité"
                      value={flockingNote}
                    />
                  </div>
                  <p className="rounded-lg border border-[#d9dde2]/25 bg-white/10 p-3 text-sm font-semibold text-[#f5f7f9] sm:col-span-2">
                    Une avance est demandee avant preparation pour toute commande avec flocage.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="inline-flex h-11 items-center rounded-lg border border-white/10 bg-[#060607]">
              <button
                className="grid h-11 w-11 place-items-center text-zinc-300 disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                type="button"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                className="grid h-11 w-11 place-items-center text-zinc-300 disabled:opacity-40"
                disabled={quantity >= maxStock}
                onClick={() => setQuantity((value) => Math.min(maxStock, value + 1))}
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-2xl font-black text-white">{formatPrice(total)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" disabled={maxStock === 0} size="lg" type="submit">
            {added ? <Check size={19} /> : <ShoppingBag size={19} />}
            {added ? "Ajouté au panier" : "Ajouter au panier"}
          </Button>
          <LinkButton className="w-full sm:w-auto" href="/panier" size="lg" variant="secondary">
            Voir le panier
          </LinkButton>
        </div>
        </form>
      </div>
      <ProductReviews productId={product.id} />
    </div>
  );
}
