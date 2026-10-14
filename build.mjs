import { build, context } from "esbuild";
import { cp, mkdir } from "node:fs/promises";

const opts = {
  entryPoints: {
    background: "src/background.ts",
    panel: "src/panel.ts",
    "localhost-guard": "src/localhost-guard.ts",
  },
  bundle: true,
  outdir: "dist",
  target: "chrome120",
  format: "iife",
  sourcemap: true,
};

await mkdir("dist", { recursive: true });
await cp("static", "dist", { recursive: true });

if (process.argv.includes("--watch")) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log("watching...");
} else {
  await build(opts);
  console.log("built to dist/");
}
