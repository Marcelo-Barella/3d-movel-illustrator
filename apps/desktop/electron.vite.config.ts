import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

const movelAliases = {
  "@movel/shared": resolve("../../packages/shared/src/index.ts"),
  "@movel/scene": resolve("../../packages/scene/src/index.ts"),
  "@movel/catalog": resolve("../../packages/catalog/src/index.ts"),
  "@movel/production": resolve("../../packages/production/src/index.ts"),
  "@movel/commercial": resolve("../../packages/commercial/src/index.ts"),
  "@movel/agent": resolve("../../packages/agent/src/index.ts"),
  "@movel/importers": resolve("../../packages/importers/src/index.ts"),
};

const movelExclude = Object.keys(movelAliases);

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: movelExclude })],
    resolve: {
      alias: movelAliases,
    },
    build: {
      rollupOptions: {
        output: {
          format: "cjs",
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
        ...movelAliases,
      },
    },
    plugins: [react()],
  },
});
