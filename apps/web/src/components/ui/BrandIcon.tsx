import Image from "next/image";
import { iconSrc, type IconName } from "@/config/artwork";

/** Brand line icon from the Society guideline icon set (decorative; meaning is always in adjacent text). */
export function BrandIcon({ name, size = 64, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <Image
      src={iconSrc(name)}
      width={size}
      height={size}
      alt=""
      unoptimized
      {...(className ? { className } : {})}
    />
  );
}
