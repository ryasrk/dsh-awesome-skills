/**
 * Minimal structural contract with the Cordis context this plugin actually
 * uses. Declared locally on purpose: @deepseek-ai/cordis is vendored inside
 * the DeepSeek Harness repository and is NOT published to npm, so depending
 * on its types would make this package uninstallable outside a Harness
 * checkout. The loader passes the real context; these are the only members
 * we touch, and structural typing keeps us honest about that surface.
 */
export {};
//# sourceMappingURL=cordis-types.js.map