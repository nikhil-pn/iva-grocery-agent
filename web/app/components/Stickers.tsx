// 2D die-cut stickers for the sponsors and the product (official 0G and Arkiv marks).
/* eslint-disable @next/next/no-img-element */

export function ZeroGSticker({ className = "", label = "compute" }: { className?: string; label?: string }) {
  return (
    <span className={`sticker rounded-2xl bg-black px-[0.9em] py-[0.55em] text-white ${className}`}>
      <img src="/logos/0g-white.svg" alt="0G" className="h-[1.15em] w-auto" />
      {label && <span className="font-semibold leading-none">{label}</span>}
    </span>
  );
}

export function ArkivSticker({ className = "", label = "arkiv" }: { className?: string; label?: string }) {
  return (
    <span className={`sticker rounded-2xl bg-white py-[0.35em] pl-[0.35em] pr-[0.9em] text-ink ${className}`}>
      <img src="/logos/arkiv.svg" alt="" className="h-[1.7em] w-auto rounded-lg ring-1 ring-black/10" />
      <span className="font-semibold leading-none">{label}</span>
    </span>
  );
}

export function ZeptoSticker({ className = "", label = "order on zepto" }: { className?: string; label?: string }) {
  return (
    <span className={`sticker rounded-full bg-[#4f1c8c] px-[0.9em] py-[0.5em] font-semibold leading-none text-white ${className}`}>
      {label}
    </span>
  );
}

/** Little white shelf label, like the ones stuck on the basket in the reference shots. */
export function PriceLabel({ name, price, className = "" }: { name: string; price: string; className?: string }) {
  return (
    <span className={`sticker flex-col items-start gap-0 rounded-[0.35em] border-2 bg-white px-[0.6em] py-[0.35em] text-ink ${className}`}>
      <span className="text-[0.7em] uppercase leading-tight tracking-wide text-ink/60">{name}</span>
      <span className="font-bold leading-tight">{price}</span>
    </span>
  );
}
