import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  prerender: [
    "/",
    "/terms",
    "/privacy",
    // Add specific routes for SSG pre-rendering
    // These will be statically generated at build time
  ],
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
