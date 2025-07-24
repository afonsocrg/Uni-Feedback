// vite.config.ts
import tailwindcss from "file:///Users/afonsocrg/docs/uni-feedback/apps/website/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///Users/afonsocrg/docs/uni-feedback/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/afonsocrg/docs/uni-feedback/node_modules/vite/dist/node/index.js";
import {
  getViteAliasFromTsconfig,
  markdownLoaderPlugin
} from "file:///Users/afonsocrg/docs/uni-feedback/packages/vite-utils/dist/index.js";
var __vite_injected_original_dirname = "/Users/afonsocrg/docs/uni-feedback/apps/website";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss(), markdownLoaderPlugin()],
  resolve: {
    alias: getViteAliasFromTsconfig("./tsconfig.json", __vite_injected_original_dirname)
  },
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
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYWZvbnNvY3JnL2RvY3MvdW5pLWZlZWRiYWNrL2FwcHMvd2Vic2l0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Fmb25zb2NyZy9kb2NzL3VuaS1mZWVkYmFjay9hcHBzL3dlYnNpdGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Fmb25zb2NyZy9kb2NzL3VuaS1mZWVkYmFjay9hcHBzL3dlYnNpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHtcbiAgZ2V0Vml0ZUFsaWFzRnJvbVRzY29uZmlnLFxuICBtYXJrZG93bkxvYWRlclBsdWdpblxufSBmcm9tICdAdW5pLWZlZWRiYWNrL3ZpdGUtdXRpbHMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKSwgbWFya2Rvd25Mb2FkZXJQbHVnaW4oKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogZ2V0Vml0ZUFsaWFzRnJvbVRzY29uZmlnKCcuL3RzY29uZmlnLmpzb24nLCBfX2Rpcm5hbWUpXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J11cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zbG90JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcCdcbiAgICAgICAgICBdLFxuICAgICAgICAgICdmb3JtLXZlbmRvcic6IFsncmVhY3QtaG9vay1mb3JtJywgJ0Bob29rZm9ybS9yZXNvbHZlcnMnLCAnem9kJ10sXG4gICAgICAgICAgJ2FuaW1hdGlvbi12ZW5kb3InOiBbJ2ZyYW1lci1tb3Rpb24nXSxcbiAgICAgICAgICAndXRpbHMtdmVuZG9yJzogWydzb25uZXInLCAnbHVjaWRlLXJlYWN0J11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlXG4gICAgICB9XG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxPQUFPLGlCQUFpQjtBQUN2VixPQUFPLFdBQVc7QUFDbEIsU0FBUyxvQkFBb0I7QUFDN0I7QUFBQSxFQUNFO0FBQUEsRUFDQTtBQUFBLE9BQ0s7QUFOUCxJQUFNLG1DQUFtQztBQVN6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztBQUFBLEVBQ3hELFNBQVM7QUFBQSxJQUNQLE9BQU8seUJBQXlCLG1CQUFtQixnQ0FBUztBQUFBLEVBQzlEO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsYUFBYTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGVBQWUsQ0FBQyxtQkFBbUIsdUJBQXVCLEtBQUs7QUFBQSxVQUMvRCxvQkFBb0IsQ0FBQyxlQUFlO0FBQUEsVUFDcEMsZ0JBQWdCLENBQUMsVUFBVSxjQUFjO0FBQUEsUUFDM0M7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
