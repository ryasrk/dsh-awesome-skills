/**
 * Minimal typing surface for the vendored onnxruntime-web wasm bundle.
 * Only the members this package actually uses are described; the real bundle
 * is loaded dynamically at runtime by loadOrt().
 */

export interface OrtTensor {
  new (
    type: string,
    data: BigInt64Array | Float32Array | Uint8Array | Int8Array | Uint32Array | Int32Array,
    dims: number[],
  ): OrtTensorInstance
}

export interface OrtTensorInstance {
  data: BigInt64Array | Float32Array | Uint8Array
  dims: number[]
  type: string
}

export interface OrtSessionRunOptions {
  input_ids: OrtTensorInstance
  attention_mask: OrtTensorInstance
  token_type_ids: OrtTensorInstance
}

export interface OrtSession {
  run(feeds: OrtSessionRunOptions): Promise<Record<string, OrtTensorInstance>>
}

export interface OrtSessionOptions {
  executionProviders?: string[]
}

export interface OrtEnv {
  wasm: {
    wasmPaths?: string
    numThreads?: number
  }
}

export interface OrtStatic {
  InferenceSession: {
    create(
      model: Uint8Array,
      options?: OrtSessionOptions,
    ): Promise<OrtSession>
  }
  Tensor: OrtTensor
  env: OrtEnv
}

/** The shape of the module loadOrt() resolves. */
export type OrtModule = OrtStatic
