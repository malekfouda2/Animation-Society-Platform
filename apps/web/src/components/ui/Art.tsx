import type { Locale } from "@as/contracts";
import Image from "next/image";
import { ARTWORK, type ArtworkKey } from "@/config/artwork";

interface Props {
  name: ArtworkKey;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Scroll parallax factor for MotionEngine (decorative art only), e.g. 0.15 or -0.1. */
  speed?: number;
}

/** Renders a manifest artwork; decorative entries get empty alt. SVGs bypass the optimizer. */
export function Art({ name, locale, className, sizes = "100vw", priority = false, speed }: Props) {
  const art = ARTWORK[name];
  const isSvg = art.src.endsWith(".svg");
  return (
    <Image
      src={art.src}
      width={art.width}
      height={art.height}
      alt={art.alt ? art.alt[locale] : ""}
      sizes={sizes}
      priority={priority}
      unoptimized={isSvg}
      {...(className ? { className } : {})}
      {...(speed ? { "data-speed": String(speed) } : {})}
    />
  );
}
