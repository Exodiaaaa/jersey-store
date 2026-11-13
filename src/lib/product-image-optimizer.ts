import {
  isSupportedProductImageType,
  MAX_OPTIMIZED_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_BYTES,
} from "@/lib/product-images";

const MAX_IMAGE_EDGE = 3200;
const MIN_IMAGE_EDGE = 1440;
const RESIZE_FACTOR = 0.88;
const QUALITY_STEPS = [0.96, 0.92, 0.88, 0.84, 0.8, 0.76] as const;
const OUTPUT_TYPES = ["image/webp", "image/jpeg"] as const;

function canvasToBlob(canvas: HTMLCanvasElement, type: (typeof OUTPUT_TYPES)[number], quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("La compression de la photo a echoue."));
      },
      type,
      quality,
    );
  });
}

function drawImage(image: HTMLImageElement, width: number, height: number, background?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("La compression des photos n'est pas disponible sur ce navigateur.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

async function encodeImage(image: HTMLImageElement, width: number, height: number) {
  for (const type of OUTPUT_TYPES) {
    const canvas = drawImage(image, width, height, type === "image/jpeg" ? "#fff" : undefined);

    for (const quality of QUALITY_STEPS) {
      const compressed = await canvasToBlob(canvas, type, quality);

      // Certains navigateurs retournent un PNG quand l'encodage WEBP n'est pas disponible.
      // Dans ce cas, on ignore ce resultat et on utilise le JPEG, pris en charge partout.
      if (compressed.type.toLowerCase() !== type) break;
      if (compressed.size <= MAX_OPTIMIZED_IMAGE_BYTES) return compressed;
    }

    // Libere la grande surface avant d'essayer le format suivant sur les telephones.
    canvas.width = 1;
    canvas.height = 1;
  }

  return null;
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

    if (file.size <= MAX_OPTIMIZED_IMAGE_BYTES && Math.max(originalWidth, originalHeight) <= MAX_IMAGE_EDGE) {
      return blobToDataUrl(file);
    }

    const initialScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(originalWidth, originalHeight));
    let width = Math.max(1, Math.round(originalWidth * initialScale));
    let height = Math.max(1, Math.round(originalHeight * initialScale));

    for (let resizeAttempt = 0; resizeAttempt < 10; resizeAttempt += 1) {
      const compressed = await encodeImage(image, width, height);
      if (compressed) return blobToDataUrl(compressed);

      const currentEdge = Math.max(width, height);
      if (currentEdge <= MIN_IMAGE_EDGE) break;

      const nextEdge = Math.max(MIN_IMAGE_EDGE, Math.round(currentEdge * RESIZE_FACTOR));
      const nextScale = nextEdge / currentEdge;
      width = Math.max(1, Math.round(width * nextScale));
      height = Math.max(1, Math.round(height * nextScale));
    }

    throw new Error("Cette photo reste trop volumineuse apres compression. Choisissez une autre photo.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
