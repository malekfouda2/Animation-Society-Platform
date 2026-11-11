import { API_BASE_PATH, isFullCrop, type Locale, type MediaRef } from "@as/contracts";

export const mediaSrc = (id: string) => `${API_BASE_PATH}/media/${id}`;

/**
 * An uploaded image (served by the API, already re-encoded and sized on upload, so no further
 * optimisation runs here). Width and height from the upload reserve its space before it loads.
 *
 * A crop is drawn without touching the file: an SVG whose viewBox is the cropped area shows exactly
 * that part, scaled to whatever box the page gives it ("cover" fills the box, "contain" fits inside).
 */
export function MediaImage({
  media,
  locale,
  className,
  sizes,
  priority,
  fit = "cover",
}: {
  media: MediaRef;
  locale: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  if (!media.id) return null;
  const alt = media.alt[locale];
  if (!isFullCrop(media.crop) && media.width > 0 && media.height > 0) {
    const { width: W, height: H, crop: c } = media;
    const vw = Math.max(1, Math.round(c.w * W));
    const vh = Math.max(1, Math.round(c.h * H));
    return (
      <svg
        className={className}
        viewBox={`${Math.round(c.x * W)} ${Math.round(c.y * H)} ${vw} ${vh}`}
        width={vw}
        height={vh}
        preserveAspectRatio={fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"}
        role="img"
        aria-label={alt}
      >
        <image href={mediaSrc(media.id)} width={W} height={H} />
      </svg>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by the API; resized on upload, not by next/image
    <img
      src={mediaSrc(media.id)}
      alt={alt}
      width={media.width || undefined}
      height={media.height || undefined}
      className={className}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
