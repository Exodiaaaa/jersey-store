import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DATA_IMAGE_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/;
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const imageId = Number(id);

  if (!Number.isSafeInteger(imageId) || imageId <= 0) {
    return NextResponse.json({ message: "Image not found" }, { status: 404 });
  }

  const image = await prisma.productImage.findUnique({
    select: { url: true },
    where: { id: imageId },
  });

  if (!image) {
    return NextResponse.json({ message: "Image not found" }, { status: 404 });
  }

  const dataImage = DATA_IMAGE_PATTERN.exec(image.url);
  if (dataImage) {
    const body = Buffer.from(dataImage[2], "base64");

    return new Response(body, {
      headers: {
        "Cache-Control": IMMUTABLE_CACHE,
        "Content-Length": String(body.byteLength),
        "Content-Type": dataImage[1],
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const target = image.url.startsWith("/")
    ? new URL(image.url, request.url)
    : /^https?:\/\//i.test(image.url)
      ? new URL(image.url)
      : null;

  if (!target) {
    return NextResponse.json({ message: "Image not found" }, { status: 404 });
  }

  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", IMMUTABLE_CACHE);
  return response;
}
