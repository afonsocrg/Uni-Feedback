// vite.config.ts
import tailwindcss from "file:///Users/afonsocrg/docs/uni-feedback/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///Users/afonsocrg/docs/uni-feedback/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import { defineConfig } from "file:///Users/afonsocrg/docs/uni-feedback/node_modules/vite/dist/node/index.js";

// tsconfig.json
var tsconfig_default = {
  compilerOptions: {
    baseUrl: ".",
    module: "ESNext",
    moduleResolution: "bundler",
    target: "ESNext",
    jsx: "react-jsx",
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    paths: {
      "@/*": ["./src/*"],
      "@components": ["./src/components"],
      "@context": ["./src/context"],
      "@hooks": ["./src/hooks"],
      "@pages": ["./src/pages"],
      "@pages/*": ["./src/pages/*"],
      "@services/*": ["./src/services/*"],
      "@lib/*": ["../lib/src/*"],
      "@utils": ["./src/utils"],
      "@utils/*": ["./src/utils/*"],
      "@ui": ["./src/components/ui"],
      "@ui/*": ["./src/components/ui/*"],
      "@md/*": ["./src/md/*"]
    }
  },
  include: ["src/**/*", "../lib/src/**/*"]
};

// vite.config.ts
var __vite_injected_original_dirname = "/Users/afonsocrg/docs/uni-feedback/apps/website";
function getAlias() {
  const paths = tsconfig_default.compilerOptions.paths;
  const alias = {};
  for (const pathKey in paths) {
    const target = paths[pathKey][0];
    const key = pathKey.replace("/*", "");
    const value = target.replace("/*", "").replace("./", "").replace("../", "");
    if (target.startsWith("../")) {
      alias[key] = path.resolve(__vite_injected_original_dirname, target.replace("/*", ""));
    } else {
      alias[key] = path.resolve(__vite_injected_original_dirname, value);
    }
  }
  return alias;
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "markdown-loader",
      transform(code, id) {
        if (id.endsWith(".md")) {
          return {
            code: `export default ${JSON.stringify(code)}`,
            map: null
          };
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-slot",
            "@radix-ui/react-toast",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip"
          ],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "animation-vendor": ["framer-motion"],
          "utils-vendor": ["sonner", "lucide-react"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: getAlias()
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAidHNjb25maWcuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9hZm9uc29jcmcvZG9jcy91bmktZmVlZGJhY2svYXBwcy93ZWJzaXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYWZvbnNvY3JnL2RvY3MvdW5pLWZlZWRiYWNrL2FwcHMvd2Vic2l0ZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYWZvbnNvY3JnL2RvY3MvdW5pLWZlZWRiYWNrL2FwcHMvd2Vic2l0ZS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHRzY29uZmlnIGZyb20gJy4vdHNjb25maWcuanNvbidcblxuLy8gQ29udmVydCBwYXRocyBmcm9tIHRzY29uZmlnLmpzb25cbmZ1bmN0aW9uIGdldEFsaWFzKCkge1xuICBjb25zdCBwYXRocyA9IHRzY29uZmlnLmNvbXBpbGVyT3B0aW9ucy5wYXRocyBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT5cbiAgY29uc3QgYWxpYXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuICBmb3IgKGNvbnN0IHBhdGhLZXkgaW4gcGF0aHMpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBwYXRoc1twYXRoS2V5XVswXVxuICAgIGNvbnN0IGtleSA9IHBhdGhLZXkucmVwbGFjZSgnLyonLCAnJylcbiAgICBjb25zdCB2YWx1ZSA9IHRhcmdldC5yZXBsYWNlKCcvKicsICcnKS5yZXBsYWNlKCcuLycsICcnKS5yZXBsYWNlKCcuLi8nLCAnJylcblxuICAgIC8vIEhhbmRsZSByZWxhdGl2ZSBwYXRoc1xuICAgIGlmICh0YXJnZXQuc3RhcnRzV2l0aCgnLi4vJykpIHtcbiAgICAgIGFsaWFzW2tleV0gPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCB0YXJnZXQucmVwbGFjZSgnLyonLCAnJykpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFsaWFzW2tleV0gPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCB2YWx1ZSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFsaWFzXG59XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHtcbiAgICAgIG5hbWU6ICdtYXJrZG93bi1sb2FkZXInLFxuICAgICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICAgIGlmIChpZC5lbmRzV2l0aCgnLm1kJykpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogYGV4cG9ydCBkZWZhdWx0ICR7SlNPTi5zdHJpbmdpZnkoY29kZSl9YCxcbiAgICAgICAgICAgIG1hcDogbnVsbFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgXSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXVxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd1aS12ZW5kb3InOiBbXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXInLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ2Zvcm0tdmVuZG9yJzogWydyZWFjdC1ob29rLWZvcm0nLCAnQGhvb2tmb3JtL3Jlc29sdmVycycsICd6b2QnXSxcbiAgICAgICAgICAnYW5pbWF0aW9uLXZlbmRvcic6IFsnZnJhbWVyLW1vdGlvbiddLFxuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ3Nvbm5lcicsICdsdWNpZGUtcmVhY3QnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogZ2V0QWxpYXMoKVxuICB9XG59KVxuIiwgIntcbiAgXCJjb21waWxlck9wdGlvbnNcIjoge1xuICAgIFwiYmFzZVVybFwiOiBcIi5cIixcbiAgICBcIm1vZHVsZVwiOiBcIkVTTmV4dFwiLFxuICAgIFwibW9kdWxlUmVzb2x1dGlvblwiOiBcImJ1bmRsZXJcIixcbiAgICBcInRhcmdldFwiOiBcIkVTTmV4dFwiLFxuICAgIFwianN4XCI6IFwicmVhY3QtanN4XCIsXG4gICAgXCJzdHJpY3RcIjogdHJ1ZSxcbiAgICBcImVzTW9kdWxlSW50ZXJvcFwiOiB0cnVlLFxuICAgIFwic2tpcExpYkNoZWNrXCI6IHRydWUsXG4gICAgXCJmb3JjZUNvbnNpc3RlbnRDYXNpbmdJbkZpbGVOYW1lc1wiOiB0cnVlLFxuICAgIFwicGF0aHNcIjoge1xuICAgICAgXCJALypcIjogW1wiLi9zcmMvKlwiXSxcbiAgICAgIFwiQGNvbXBvbmVudHNcIjogW1wiLi9zcmMvY29tcG9uZW50c1wiXSxcbiAgICAgIFwiQGNvbnRleHRcIjogW1wiLi9zcmMvY29udGV4dFwiXSxcbiAgICAgIFwiQGhvb2tzXCI6IFtcIi4vc3JjL2hvb2tzXCJdLFxuICAgICAgXCJAcGFnZXNcIjogW1wiLi9zcmMvcGFnZXNcIl0sXG4gICAgICBcIkBwYWdlcy8qXCI6IFtcIi4vc3JjL3BhZ2VzLypcIl0sXG4gICAgICBcIkBzZXJ2aWNlcy8qXCI6IFtcIi4vc3JjL3NlcnZpY2VzLypcIl0sXG4gICAgICBcIkBsaWIvKlwiOiBbXCIuLi9saWIvc3JjLypcIl0sXG4gICAgICBcIkB1dGlsc1wiOiBbXCIuL3NyYy91dGlsc1wiXSxcbiAgICAgIFwiQHV0aWxzLypcIjogW1wiLi9zcmMvdXRpbHMvKlwiXSxcbiAgICAgIFwiQHVpXCI6IFtcIi4vc3JjL2NvbXBvbmVudHMvdWlcIl0sXG4gICAgICBcIkB1aS8qXCI6IFtcIi4vc3JjL2NvbXBvbmVudHMvdWkvKlwiXSxcbiAgICAgIFwiQG1kLypcIjogW1wiLi9zcmMvbWQvKlwiXVxuICAgIH1cbiAgfSxcbiAgXCJpbmNsdWRlXCI6IFtcInNyYy8qKi8qXCIsIFwiLi4vbGliL3NyYy8qKi8qXCJdXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStULE9BQU8saUJBQWlCO0FBQ3ZWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7OztBQ0g3QjtBQUFBLEVBQ0UsaUJBQW1CO0FBQUEsSUFDakIsU0FBVztBQUFBLElBQ1gsUUFBVTtBQUFBLElBQ1Ysa0JBQW9CO0FBQUEsSUFDcEIsUUFB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
