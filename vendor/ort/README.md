# Vendored onnxruntime-web (wasm bundle)

Files copied from `onnxruntime-web@1.29.0/dist/`:

- `ort.wasm.bundle.min.mjs` — the runtime this package imports dynamically
- `ort-wasm-simd-threaded.mjs` — the ESM loader the bundle instantiates
- `ort-wasm-simd-threaded.wasm` — the compiled inference kernel

Why vendored instead of depended on: `onnxruntime-web` declares `protobufjs`
as a dependency, and `protobufjs` has a `postinstall` script. pnpm 10+ refuses
to run unreviewed lifecycle scripts and fails the install until the user adds
an `allowBuilds` entry to the profile's `pnpm-workspace.yaml`. The runtime
bundle this package actually imports has zero protobufjs references, so the
dependency exists only to trip that gate.

Vendoring three files removes every npm dependency and every lifecycle script
from this package: `dsh plugin --profile web add github:ryasrk/dsh-awesome-skills`
completes on a clean machine with no manual pnpm configuration.

To upgrade onnxruntime-web, re-copy these three files from the new version's
`dist/` and re-run the query smoke test.
