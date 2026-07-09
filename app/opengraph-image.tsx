import { ImageResponse } from 'next/og'
import { BRAND, ICON_SVG, svgDataUri } from '@/lib/brand-mark'
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/site'

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Open Graph / social share card — Morning Edition editorial layout:
 * warm newsprint paper, warm ink, one rationed vermilion accent, a soft
 * dawn glow, and the brand mark + wordmark masthead.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BRAND.paper,
          color: BRAND.ink,
          padding: '76px 80px',
          position: 'relative',
        }}
      >
        {/* dawn glow, top-right */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -140,
            width: 560,
            height: 560,
            display: 'flex',
            background:
              'radial-gradient(circle, rgba(235,74,39,0.18), rgba(235,74,39,0) 70%)',
          }}
        />

        {/* masthead */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgDataUri(ICON_SVG)} width={68} height={68} alt="" />
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginLeft: 20,
              fontSize: 34,
              fontWeight: 600,
              letterSpacing: -1,
            }}
          >
            <span>{SITE_NAME}</span>
            <span style={{ color: BRAND.vermilion }}>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 15,
              letterSpacing: 5,
              color: BRAND.caption,
            }}
          >
            MORNING EDITION
          </div>
        </div>

        {/* headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            {SITE_TAGLINE}.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 26,
              lineHeight: 1.4,
              color: BRAND.caption,
              maxWidth: 860,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        {/* footer rule */}
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 19, color: BRAND.caption }}>
          <div style={{ display: 'flex', width: 44, height: 4, background: BRAND.vermilion }} />
          <span style={{ marginLeft: 16 }}>
            Sent from your own inbox · You approve every email
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
