/**
 * Loads the vendored onnxruntime-web wasm bundle.
 *
 * Imported dynamically so the .wasm assets are only touched when a search
 * actually runs, and so this package keeps zero static npm dependencies.
 */

import type { OrtModule } from './ort-types.js'

/**
 * @param distDir - directory holding ort.wasm.bundle.min.mjs and the .wasm files.
 * @returns the ort module with wasmPaths pre-set for Node.
 */
export async function loadOrt(distDir: string): Promise<OrtModule> {
  const mod = (await import(/* @vite-ignore */ 'file://' + distDir + '/ort.wasm.bundle.min.mjs')) as unknown as OrtModule
  // Node ESM cannot fetch() a relative .wasm URL; hand ort the on-disk
  // directory so its locateFile() resolves real file paths. A CLI process
  // has no worker pool, so stay single-threaded.
  mod.env.wasm.wasmPaths = distDir + '/'
  mod.env.wasm.numThreads = 1
  return mod
}
