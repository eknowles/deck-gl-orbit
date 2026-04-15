import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    react: "src/react.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  outDir: "dist",
  treeshake: true,
  sourcemap: true,
  deps: {
    neverBundle: [
      "react",
      "react-dom",
      "@deck.gl/core",
      "@deck.gl/layers",
      "@deck.gl/react",
      "geolib",
      "debug",
      "mjolnir.js",
    ],
  },
  shims: true,
  exports: true,
});
