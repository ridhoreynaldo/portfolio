import { build } from "esbuild";

// Bundle scripts/migrate.ts (alias @/ terselesaikan); dependency tetap dari node_modules.
await build({
  entryPoints: ["scripts/migrate.ts"],
  outfile: "dist/migrate.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  sourcemap: true,
  logLevel: "info",
});
