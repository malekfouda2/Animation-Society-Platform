import Image from "next/image";
import { LOGO, LOGO_MIN_WIDTH } from "@/config/artwork";

type Variant = keyof typeof LOGO;

interface Props {
  variant?: Variant;
  /** Rendered width in CSS px; clamped to the guideline minimum (130 px). */
  width?: number;
  alt: string;
  priority?: boolean;
  className?: string;
}

/** The Society logo from the supplied vector master. Never recoloured, distorted or cropped (guideline pp.14–15). */
export function BrandLogo({ variant = "color", width = LOGO_MIN_WIDTH, alt, priority = false, className }: Props) {
  const file = LOGO[variant];
  const w = Math.max(width, LOGO_MIN_WIDTH);
  const h = Math.round((w * file.height) / file.width);
  return (
    <Image
      src={file.src}
      width={w}
      height={h}
      alt={alt}
      priority={priority}
      unoptimized
      {...(className ? { className } : {})}
    />
  );
}
