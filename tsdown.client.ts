/**
 * Browser client bundle config for dsh-awesome-skills.
 *
 * Mirrors the DeepSeek Harness client preset (packages/client/tsdown.client.ts)
 * as dsh-market does for an external package: a closure-factory artifact that
 * calls window.__ModuleLoader__.load({ id, factory }) and resolves externals
 * through the injected loader module table — cordis DI entities, no globals,
 * no import map.
 *
 * CSS Modules compile through a virtual-id plugin (dsh-market's pattern) rather
 * than tsdown's own css pipeline, which would require @tsdown/css as a build
 * dependency. The plugin reads the stylesheet, compiles it with lightningcss,
 * and emits a module that injects one <style data-plugin-css> tag at factory
 * execution — idempotent under re-evaluation, removed by the loader on unload.
 */

import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import { defineConfig, type UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

const id = 'dsh-awesome-skills'

/**
 * Externals resolved from the loader module table at runtime. Only the
 * platform seed entries this bundle actually requires; everything else
 * inlines. Listing a specifier the table cannot answer is a guaranteed
 * runtime throw.
 */
const CLIENT_EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', '@deepseek-ai/dsh-client-ui-primitives']

/**
 * Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline.
 * The suffix matters: tsdown's guard matches ids ending in `.css`, so the
 * virtual id must not.
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/**
 * A stable, machine-independent id for a stylesheet. Deriving the virtual id
 * from the absolute path leaked that path into the bundle as a sourcemap
 * region comment, which the preflight path rule (rightly) rejects; keying on
 * the file's own name keeps the artifact portable.
 */
function cssVirtualKey(abs: string): string {
  return basename(abs).replace(/[^A-Za-z0-9_-]/g, '_')
}

/** resolveId runs before load, so this maps each key back to its real file. */
const cssFilesByKey = new Map<string, string>()

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
  banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  footer: 'return module.exports; } });',
  plugins: [{
    name: 'dsh-awesome-skills-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? resolvePath(dirname(importer), source) : source
      const key = cssVirtualKey(abs)
      cssFilesByKey.set(key, abs)
      return CSS_VIRTUAL_PREFIX + key + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const key = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      const fileId = cssFilesByKey.get(key)
      if (fileId === undefined) return null
      // The virtual id otherwise hides the stylesheet from Rolldown's watch graph.
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: key,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
        // Without targets lightningcss collapses a hand-written
        // `backdrop-filter` + `-webkit-backdrop-filter` pair to -webkit- only,
        // losing Firefox. Targets (major << 16) keep both.
        targets: { chrome: 90 << 16, firefox: 100 << 16, safari: 13 << 16, edge: 90 << 16 },
      })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      // One <style data-plugin-css> per stylesheet; idempotent on re-eval,
      // removed by the loader when the plugin unloads.
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(`${id}/${key}`)};`,
        'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
        '  const tag = document.createElement(\'style\');',
        `  tag.dataset.plugin = ${JSON.stringify(id)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }],
})
