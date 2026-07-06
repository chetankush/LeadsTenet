/**
 * "Approved by you": a restrained editorial ink-stamp (not a green checkmark).
 * Pure vector; colour comes from `text-vermilion` via currentColor.
 */
export function InkStamp({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 132"
      role="img"
      aria-label="Approved by you"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-vermilion ${className}`}
    >
      <g stroke="currentColor">
        <rect x="4" y="4" width="252" height="124" rx="10" strokeWidth="2.5" />
        <rect x="13" y="13" width="234" height="106" rx="6" strokeWidth="1" opacity="0.5" />
        <line x1="80" y1="66" x2="102" y2="66" strokeWidth="1" opacity="0.5" />
        <line x1="158" y1="66" x2="180" y2="66" strokeWidth="1" opacity="0.5" />
      </g>
      <text
        x="130"
        y="54"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="26"
        fontWeight="700"
        letterSpacing="2"
      >
        APPROVED
      </text>
      <text
        x="130"
        y="88"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="26"
        fontWeight="700"
        letterSpacing="7"
      >
        BY YOU
      </text>
      <text
        x="130"
        y="114"
        textAnchor="middle"
        fill="currentColor"
        opacity="0.8"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="9"
        fontWeight="500"
        letterSpacing="3"
      >
        NOTHING SENDS WITHOUT YOUR SAY-SO
      </text>
    </svg>
  )
}
