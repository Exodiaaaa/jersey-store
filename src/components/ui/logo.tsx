import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
  return (
    <Link className="inline-flex min-w-0 items-center gap-3" href="/">
      <span className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black">
        <Image
          alt="Logo boutique maillots"
          className="object-cover"
          fill
          priority
          src="/brand-logo.jpeg"
          sizes="44px"
        />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-black uppercase text-white">KVN Footwear</span>
          <span className="block truncate text-xs text-zinc-400">Football kits premium</span>
        </span>
      )}
    </Link>
  );
}
