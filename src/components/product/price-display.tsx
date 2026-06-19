import { formatPrice } from "@/lib/format";

type PriceDisplayProps = {
  currentPrice: number;
  originalPrice?: number;
  align?: "left" | "right";
  size?: "sm" | "md" | "lg";
};

const currentPriceSizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function PriceDisplay({ currentPrice, originalPrice, align = "left", size = "md" }: PriceDisplayProps) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      {originalPrice && (
        <p className="text-xs font-semibold text-zinc-500 line-through">{formatPrice(originalPrice)}</p>
      )}
      <p className={`${currentPriceSizes[size]} font-black text-white`}>{formatPrice(currentPrice)}</p>
    </div>
  );
}
