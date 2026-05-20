/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // The starter ships with pre-existing lint debt (unused vars, unescaped
    // JSX entities, explicit `any`). Don't block production builds on it —
    // TypeScript type-checking still runs during `next build`.
    // Run `npm run lint` to see/fix lint issues.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
