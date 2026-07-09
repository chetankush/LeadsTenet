import { ImageResponse } from 'next/og'
import { BRAND, PLANE_SVG, svgDataUri } from '@/lib/brand-mark'

// iOS masks the icon into a rounded square itself, so we render full-bleed
// vermilion with the cream paper-plane centred (no transparent corners).
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${BRAND.vermilionTop}, ${BRAND.vermilionBottom})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri(PLANE_SVG)} width={116} height={116} alt="" />
      </div>
    ),
    { ...size }
  )
}
