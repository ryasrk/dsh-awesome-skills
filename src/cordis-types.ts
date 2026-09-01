/**
 * Minimal structural contract with the Cordis context this plugin actually
 * uses. Declared locally on purpose: @deepseek-ai/cordis is vendored inside
 * the DeepSeek Harness repository and is NOT published to npm, so depending
 * on its types would make this package uninstallable outside a Harness
 * checkout. The loader passes the real context; these are the only members
 * we touch, and structural typing keeps us honest about that surface.
 */

/** Minimal service-registration surface (cordis Service Definition). */
export interface PluginProvider {
  provide(name: string, value?: unknown): () => void
}

/** Subset of the cordis logger this plugin calls. */
export interface PluginLogger {
  info(message: string): void
  warn(message: string): void
}

/**
 * The slice of a cordis Context a bundle sees: a logger, plus a plain bag for
 * registering services other plugins can read back.
 */
export interface PluginContext {
  readonly logger: PluginLogger
  provide(name: string, value?: unknown): () => void
  [key: string]: unknown
}

/**
 * Structural subset of a host tool definition this plugin registers. The
 * host's `tools.register` validates `output.render`, `output.schema` (against
 * its enforced JSON-Schema subset: type object/array/string/number/integer/
 * boolean/null + oneOf — the author-only `type: 'json'` DSL node is NOT valid
 * here), and the reserved-name/timeout rules at registration time. A plain
 * object is accepted without importing the harness's `defineTool` DSL (which
 * is not published to npm). `parameters` is passed through to the LLM wire
 * verbatim (`function.parameters`), so it MUST be raw JSON Schema
 * (object-rooted, `required` as an array of names) — never the DSL's
 * per-property `required: true` style, which the runtime's argument validator
 * would silently ignore.
 */
export interface ToolDefinition {
  /** Unique tool name shown to the model. */
  name: string
  /** Description sent to the model. */
  description: string
  /** Raw JSON Schema for the arguments (object-rooted). */
  parameters: Record<string, unknown>
  output: {
    /** Value schema for the execute result, in the host's supported subset. */
    schema: Record<string, unknown>
    /** Model-facing content for one validated result value. */
    render(args: unknown, value: unknown): Array<{ type: 'text'; text: string }>
  }
}

/** Structural subset of the host `tools` service registry. */
export interface ToolsService {
  /** Register one tool; returns its disposer. Throws on invalid definitions. */
  register(definition: ToolDefinition): () => void
}
