/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT use `env: { NEXTAUTH_* }` here.
  // Auth.js reads AUTH_SECRET / NEXTAUTH_SECRET and AUTH_URL / NEXTAUTH_URL
  // from process.env at runtime. The previous `env` block:
  //   1) fell back to VERCEL_URL (no https://) → Google redirect_uri_mismatch
  //   2) could inline an empty secret at build time → ?error=Configuration
  //   3) leaked NEXTAUTH_SECRET into the client bundle
};

export default nextConfig;
