import { bindings, defineConfig, defineContainer, exports } from "cf/config";

const api = defineContainer({
  name: "hexars-api",
  image: { dockerfile: "../../api/Dockerfile", buildContext: "../.." },
  instanceType: "basic",
  maxInstances: 1,
});
export default defineConfig({
  worker: {
    name: "hexars-engine",
    compatibilityDate: "2026-10-14",
    entrypoint: "./src/index.ts",
    exports: { HexarsApi: exports.durableObject({ storage: "sqlite", container: api }) },
    env: {
      HEXARS_API: bindings.durableObject({ worker: "hexars-engine", exportName: "HexarsApi" }),
      SUPABASE_URL: bindings.secret(),
      SUPABASE_SECRET_KEY: bindings.secret(),
      HEXARS_GATEWAY_SECRET: bindings.secret(),
    },
  },
  containers: [api],
});
