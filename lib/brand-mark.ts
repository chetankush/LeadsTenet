/**
 * The LeadsTenet brand mark — Morning Edition design system.
 *
 * A vermilion rounded-square tile carrying a cream, folded paper-plane
 * (the same "Send" mark used in the app sidebar). Kept as plain SVG strings
 * so it can be embedded anywhere: the static favicon, the Apple touch icon,
 * and the Open Graph / Twitter share images (via next/og `<img>`).
 */
export const BRAND = {
  paper: '#f6f5f1', // warm newsprint
  ink: '#141414', // warm ink
  caption: '#6b6b64', // secondary text
  hairline: '#e3e1db', // rules / dividers
  vermilion: '#eb4a27', // the one rationed accent
  vermilionTop: '#f0552f', // subtle tile top-light
  vermilionBottom: '#e2481f', // subtle tile shade
  planeShadow: '#e3ddcf', // folded (under) wing of the plane
} as const

// Paper-plane wings only, transparent background (512 viewBox, centred ~256).
export const PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none"><path d="M412 116 L236 258 L296 404 Z" fill="${BRAND.planeShadow}"/><path d="M412 116 L108 210 L236 258 Z" fill="${BRAND.paper}"/></svg>`

// Full app icon: rounded vermilion tile + paper-plane.
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none" role="img" aria-label="LeadsTenet"><defs><linearGradient id="lt-tile" x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="${BRAND.vermilionTop}"/><stop offset="1" stop-color="${BRAND.vermilionBottom}"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="url(#lt-tile)"/><path d="M412 116 L236 258 L296 404 Z" fill="${BRAND.planeShadow}"/><path d="M412 116 L108 210 L236 258 Z" fill="${BRAND.paper}"/></svg>`

/** Inline an SVG string as a data URI (runtime-agnostic — no Buffer). */
export const svgDataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`
