/**
 * Browser client bundle config for dsh-awesome-skills.
 *
 * Mirrors the DeepSeek Harness client preset (packages/client/tsdown.client.ts)
 * as dsh-market does for an external package: a closure-factory artifact that
 * calls window.__ModuleLoader__.load({ id, factory }) and resolves externals
 * through the injected loader module table — cordis DI entities, no globals,
 * no import map.
 */

import { defineConfig } from 'tsdown'

const id = 'dsh-awesome-skills'

/**
 * Externals resolved from the loader module table at runtime. Only the
 * platform seed entries this bundle actually requires; everything else
 * inlines. Listing a specifier the table cannot answer is a guaranteed
 * runtime throw.
 */
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives']

export default defineConfig({
  entry: { client: 'src/client/index.tsx' },
  // Published artifact location: package.json exports "./client" points here,
  // and the host's client-modules node half serves exactly this file at
  // /plugins/<id>/client.js.
  outDir: 'client',
  format: 'cjs',
  // The host serves /plugins/<id>/client.js exactly; force the extension.
  outExtensions: () => ({ js: '.js' }),
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  external: [...CLIENT_EXTERNALS],
  noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
  },
  banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require, module, exports) => {`,
  footer: '} });',
})
