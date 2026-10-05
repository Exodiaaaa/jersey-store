import {
  isSupportedProductImageType,
  MAX_OPTIMIZED_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_BYTES,
} from "@/lib/product-images";

const MAX_IMAGE_EDGE = 1600;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("La compression de la photo a echoue."));
      },
      "image/webp",
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("La lecture de la photo a echoue."));
    reader.readAsDataURL(blob);
  });
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Cette photo ne peut pas etre lue."));
    image.src = url;
  });
}

export async function optimizeProductImage(file: File) {
  if (!isSupportedProductImageType(file.type)) {
    throw new Error("Utilisez uniquement des photos JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Cette photo depasse 15 Mo. Choisissez une photo plus legere.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new Error("Les dimensions de cette photo sont invalides.");
    }

    const initialScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(originalWidth, originalHeight));
    let width = Math.max(1, Math.round(originalWidth * initialScale));
    let height = Math.max(1, Math.round(originalHeight * initialScale));
    let quality = 0.84;
    let compressed: Blob | null = null;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("La compression des photos n'est pas disponible sur ce navigateur.");

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);
      compressed = await canvasToBlob(canvas, quality);

      if (compressed.size <= MAX_OPTIMIZED_IMAGE_BYTES) {
        return blobToDataUrl(compressed);
      }

      const nextScale = Math.max(width, height) > 640 ? 0.82 : 1;
      width = Math.max(1, Math.round(width * nextScale));
      height = Math.max(1, Math.round(height * nextScale));
      quality = Math.max(0.55, quality - 0.06);
    }

    throw new Error("Cette photo reste trop volumineuse apres compression. Choisissez une autre photo.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
