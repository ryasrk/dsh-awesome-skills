/**
 * Minimal structural contract with the Cordis context this plugin actually
 * uses. Declared locally on purpose: @deepseek-ai/cordis is vendored inside
 * the DeepSeek Harness repository and is NOT published to npm, so depending
 * on its types would make this package uninstallable outside a Harness
 * checkout. The loader passes the real context; these are the only members
 * we touch, and structural typing keeps us honest about that surface.
 */

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
