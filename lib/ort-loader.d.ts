/**
 * Loads the vendored onnxruntime-web wasm bundle.
 *
 * Imported dynamically so the .wasm assets are only touched when a search
 * actually runs, and so this package keeps zero static npm dependencies.
 */
import type { OrtModule } from './ort-types.js';
/**
 * @param distDir - directory holding ort.wasm.bundle.min.mjs and the .wasm files.
 * @returns the ort module with wasmPaths pre-set for Node.
 */
export declare function loadOrt(distDir: string): Promise<OrtModule>;
//# sourceMappingURL=ort-loader.d.ts.map