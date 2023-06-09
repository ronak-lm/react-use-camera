import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tsConfigPaths from "vite-tsconfig-paths";
import VitePluginStyleInject from "vite-plugin-style-inject";

import * as packageJson from "./package.json";

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    basicSsl(),
    react(),
    tsConfigPaths(),
    VitePluginStyleInject(),
    dts({
      include: ["src/lib/"],
    }),
  ],
  build: {
    minify: true,
    lib: {
      entry: resolve("src", "lib/index.ts"),
      name: "ReactUseCamera",
      formats: ["es", "umd"],
      fileName: (format) => `react-use-camera.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
});
