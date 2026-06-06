import { ProductVisual } from "@/lib/types";

type JerseyVisualProps = {
  visual: ProductVisual;
  name: string;
  className?: string;
};

function patternStyle(visual: ProductVisual) {
  if (visual.pattern === "stripes") {
    return {
      backgroundImage: `repeating-linear-gradient(90deg, ${visual.primary} 0 18px, ${visual.secondary} 18px 34px)`,
    };
  }

  if (visual.pattern === "halves") {
    return {
      backgroundImage: `linear-gradient(90deg, ${visual.primary} 0 50%, ${visual.secondary} 50% 100%)`,
    };
  }

  if (visual.pattern === "diagonal") {
    return {
      backgroundImage: `linear-gradient(135deg, ${visual.primary} 0 48%, ${visual.secondary} 48% 58%, ${visual.primary} 58% 100%)`,
    };
  }

  if (visual.pattern === "racing") {
    return {
      backgroundImage: `linear-gradient(90deg, ${visual.primary} 0 38%, ${visual.secondary} 38% 46%, ${visual.primary} 46% 54%, ${visual.secondary} 54% 62%, ${visual.primary} 62% 100%)`,
    };
  }

  return {
    backgroundColor: visual.primary,
  };
}

export function JerseyVisual({ visual, name, className = "" }: JerseyVisualProps) {
  return (
    <div
      aria-label={name}
      className={[
        "relative isolate flex aspect-[4/5] min-h-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950",
        className,
      ].join(" ")}
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(160deg,rgba(255,255,255,0.08),transparent_45%)]" />
      <div
        className="relative h-[72%] w-[58%] rounded-b-[22%] rounded-t-lg shadow-2xl"
        style={{
          ...patternStyle(visual),
          clipPath:
            "polygon(20% 0, 37% 0, 43% 12%, 57% 12%, 63% 0, 80% 0, 100% 20%, 86% 38%, 78% 30%, 78% 100%, 22% 100%, 22% 30%, 14% 38%, 0 20%)",
        }}
      >
        <span
          className="absolute left-1/2 top-[17%] h-[16%] w-[24%] -translate-x-1/2 rounded-b-full border-b border-white/35 bg-black/20"
          style={{ borderColor: visual.trim }}
        />
        <span
          className="absolute inset-x-[20%] top-[42%] h-1 rounded-full opacity-80"
          style={{ backgroundColor: visual.trim }}
        />
        <span
          className="absolute bottom-[18%] left-1/2 h-[17%] w-[38%] -translate-x-1/2 rounded border border-black/20 bg-white/12"
          style={{ borderColor: visual.trim }}
        />
      </div>
    </div>
  );
}
