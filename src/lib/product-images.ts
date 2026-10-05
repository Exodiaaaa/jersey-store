export const MAX_PRODUCT_IMAGES = 8;
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_OPTIMIZED_IMAGE_BYTES = 900 * 1024;
export const MAX_PRODUCT_REQUEST_BYTES = 12 * 1024 * 1024;

export const SUPPORTED_PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ProductImageValidationResult =
  | { ok: true }
  | { message: string; ok: false; status: 400 | 413 };

export function isSupportedProductImageType(type: string) {
  return (SUPPORTED_PRODUCT_IMAGE_TYPES as readonly string[]).includes(type.toLowerCase());
}

export function jsonByteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function dataUrlPayloadBytes(value: string) {
  const commaIndex = value.indexOf(",");
  if (commaIndex < 0 || !value.slice(0, commaIndex).toLowerCase().endsWith(";base64")) return 0;

  const base64 = value.slice(commaIndex + 1).replace(/\s/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function validateProductImages(images: unknown): ProductImageValidationResult {
  if (!Array.isArray(images)) {
    return { message: "La liste des photos est invalide.", ok: false, status: 400 };
  }

  if (images.length > MAX_PRODUCT_IMAGES) {
    return {
      message: `Un produit ne peut pas contenir plus de ${MAX_PRODUCT_IMAGES} photos.`,
      ok: false,
      status: 400,
    };
  }

  for (const image of images) {
    if (typeof image !== "string" || image.trim().length === 0) {
      return { message: "Une photo du produit est invalide.", ok: false, status: 400 };
    }

    if (!image.startsWith("data:")) continue;

    const match = /^data:([^;,]+);base64,/i.exec(image);
    if (!match || !isSupportedProductImageType(match[1])) {
      return {
        message: "Les photos doivent etre au format JPG, PNG ou WEBP.",
        ok: false,
        status: 400,
      };
    }

    if (dataUrlPayloadBytes(image) > MAX_SOURCE_IMAGE_BYTES) {
      return {
        message: "Une photo depasse 15 Mo. Compressez-la puis reessayez.",
        ok: false,
        status: 413,
      };
    }
  }

  return { ok: true };
}

export function validateProductRequestSize(request: Request) {
  const headerValue = request.headers.get("content-length");
  if (!headerValue) return null;

  const contentLength = Number(headerValue);
  if (Number.isFinite(contentLength) && contentLength > MAX_PRODUCT_REQUEST_BYTES) {
    return {
      message: "Les photos sont trop volumineuses. Reduisez leur taille ou leur nombre puis reessayez.",
      ok: false as const,
      status: 413 as const,
    };
  }

  return null;
}
