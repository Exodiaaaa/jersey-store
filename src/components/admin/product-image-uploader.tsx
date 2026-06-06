"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/field";

type ProductImageUploaderProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const appendFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files)
      .filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type))
      .slice(0, Math.max(0, 8 - images.length));

    if (selectedFiles.length === 0) return;

    try {
      setIsReading(true);
      const nextImages = await Promise.all(selectedFiles.map(readFile));
      setPendingImages(nextImages);
    } finally {
      setIsReading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void appendFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void appendFiles(event.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, currentIndex) => currentIndex !== index));
  };

  const confirmAddImages = () => {
    onChange([...images, ...pendingImages]);
    setPendingImages([]);
  };

  const confirmRemoveImage = () => {
    if (deleteIndex === null) return;

    removeImage(deleteIndex);
    setDeleteIndex(null);
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="product-images">Photos produit</Label>
      <label
        className={[
          "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition",
          isDragging
            ? "border-amber-300 bg-amber-300/10"
            : "border-white/15 bg-zinc-950/70 hover:border-amber-300/40",
        ].join(" ")}
        htmlFor="product-images"
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="product-images"
          multiple
          onChange={handleInputChange}
          type="file"
        />
        <span className="grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-amber-200">
          {isReading ? <UploadCloud size={24} /> : <ImagePlus size={24} />}
        </span>
        <span className="mt-3 text-sm font-bold text-white">
          {isReading ? "Import en cours..." : "Déposer les photos ici"}
        </span>
        <span className="mt-1 text-xs text-zinc-500">JPG, PNG ou WEBP · 8 images max</span>
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((src, index) => (
            <div className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-zinc-950" key={`${src}-${index}`}>
              <div
                aria-label={`Photo produit ${index + 1}`}
                className="h-full w-full bg-cover bg-center"
                role="img"
                style={{ backgroundImage: `url("${src.replace(/"/g, "%22")}")` }}
              />
              <Button
                className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => setDeleteIndex(index)}
                size="icon"
                type="button"
                variant="danger"
              >
                <Trash2 size={15} />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Ajouter"
        description={`Voulez-vous ajouter ${pendingImages.length} photo(s) a ce produit ?`}
        isOpen={pendingImages.length > 0}
        onCancel={() => setPendingImages([])}
        onConfirm={confirmAddImages}
        title="Confirmer l'ajout de photos"
      />
      <ConfirmDialog
        confirmLabel="Supprimer"
        description="Voulez-vous vraiment supprimer cette photo du produit ?"
        isOpen={deleteIndex !== null}
        onCancel={() => setDeleteIndex(null)}
        onConfirm={confirmRemoveImage}
        title="Confirmer la suppression"
        tone="danger"
      />
    </div>
  );
}
