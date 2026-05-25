/**
 * Eruulkhors brand mark — bicolor disc (grass over soil).
 *
 * Rendered as two semicircle <path>s instead of the original
 * <clipPath>+<rect> recipe so we don't need a unique id per instance
 * and the SVG inlines cleanly anywhere.
 *
 * Colors are intentionally hard-coded — this is the brand palette,
 * not a themeable element. If we ever introduce dark/light variants
 * we'll add a prop here.
 */
interface Props {
  /** Pixel size of the bounding square. Default 18 — matches inline text. */
  size?: number;
  className?: string;
}

const GRASS = "#5F8F2F";
const SOIL = "#4B321F";

export function BrandMark({ size = 18, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M 76 256 A 180 180 0 0 1 436 256 Z" fill={GRASS} />
      <path d="M 76 256 A 180 180 0 0 0 436 256 Z" fill={SOIL} />
    </svg>
  );
}
