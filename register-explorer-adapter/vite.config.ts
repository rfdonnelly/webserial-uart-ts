import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: "dist",
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "RegisterExplorerAdapter",
      fileName: "register-explorer",
      formats: ["cjs", "es"],
    },
  },
  plugins: [dts()],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
