import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

import * as packageJson from "./package.json";

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      include: ["src/Camera/"],
    }),
  ],
  build: {
    minify: true,
    lib: {
      entry: resolve("src", "Camera/index.ts"),
      name: "ReactUseCamera",
      formats: ["es", "umd"],
      fileName: (format) => `react-use-camera.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
});
