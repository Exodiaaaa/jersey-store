import { ImagePlus } from "lucide-react";
import { ProductVisual } from "@/lib/types";

type ProductMediaProps = {
  name: string;
  visual?: ProductVisual;
  images?: string[];
  image?: string;
  className?: string;
};

function imageStyle(src: string) {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.24)), url("${src.replace(/"/g, "%22")}")`,
  };
}

export function ProductMedia({ name, images = [], image, className = "" }: ProductMediaProps) {
  const src = image ?? images[0];

  if (!src) {
    return (
      <div
        aria-label={`${name} - photo a ajouter`}
        className={[
          "relative isolate flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[4px] border border-dashed border-white/15 bg-[#060607] text-center",
          className,
        ].join(" ")}
        role="img"
      >
        <span className="grid h-12 w-12 place-items-center rounded-[4px] border border-white/10 bg-white/[0.04] text-[#d9dde2]">
          <ImagePlus size={24} />
        </span>
        <span className="mt-3 text-sm font-bold text-white">Photo a ajouter</span>
        <span className="mt-1 max-w-44 text-xs leading-5 text-white/48">
          Deposez les vraies photos du produit dans le back office.
        </span>
      </div>
    );
  }

  return (
    <div
      aria-label={name}
      className={[
        "relative isolate aspect-[4/5] overflow-hidden rounded-[4px] border border-white/10 bg-[#060607] bg-cover bg-center",
        className,
      ].join(" ")}
      role="img"
      style={imageStyle(src)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.16),transparent_28%)]" />
    </div>
  );
}
