#!/usr/bin/env node
/**
 * Pre-pack guard for the zero-config install contract: `dsh plugin --profile
 * web add github:ryasrk/dsh-awesome-skills` must work with no allowBuilds
 * entries, no build scripts, no lifecycle hooks. Every rule below guards a
 * bug that already shipped once because it lives in plain strings or file
 * listings no compiler checks: lib/ was gitignored, vendor/ was missing from
 * "files" (queries died with "no available backend found"), and skills.json
 * was a symlink pnpm does not resolve when packing by "files".
 */
import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const failures = []

// 1. Patch identity: the bundle patch must insert by this package's name and
// carry an id row for it.
const patch = fs.readFileSync('cordis.patch.yml', 'utf8')
if (!patch.includes("name: 'dsh-awesome-skills'")) {
  failures.push("cordis.patch.yml must contain name: 'dsh-awesome-skills'")
}
if (!/^\s*-?\s*id:\s+dsh-awesome-skills\s*$/m.test(patch)) {
  failures.push('cordis.patch.yml must contain an id: dsh-awesome-skills row')
}

// 2. Client loader id: the client must register under the package name, as a
// plain-string prefix no compiler checks.
// 3. Client file exists and is non-trivial: pnpm packs strictly by "files",
// so a missing client silently drops from the install.
const clientPath = 'client/client.js'
let client = ''
try {
  client = fs.readFileSync(clientPath, 'utf8')
}
catch { }
if (!client) {
  failures.push(`${clientPath} must exist — pnpm packs strictly by "files" and silently drops a missing entry`)
}
else {
  if (!client.startsWith('window.__ModuleLoader__.load({ id: "dsh-awesome-skills"')) {
    failures.push(`${clientPath} must start with window.__ModuleLoader__.load({ id: "dsh-awesome-skills"`)
  }
  if (client.length <= 1000) {
    failures.push(`${clientPath} must be non-trivial (> 1000 bytes), got ${client.length}`)
  }
}

// 4. "files" completeness: pnpm packs strictly by this list, and any missing
// entry is silently dropped from the install.
const requiredFiles = ['lib', 'src', 'skills', 'model', 'vendor', 'cordis.patch.yml', 'README.md', 'client']
const missingFiles = requiredFiles.filter(entry => !pkg.files?.includes(entry))
if (missingFiles.length > 0) {
  failures.push(`package.json "files" is missing: ${missingFiles.join(', ')} — pnpm packs strictly by "files", so a missing entry is silently dropped from the install`)
}

// 5. No runtime dependencies: any transitive package with a lifecycle script
// trips pnpm's build gate and breaks the zero-config install.
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  failures.push(`package.json must have no runtime dependencies, found: ${Object.keys(pkg.dependencies).join(', ')}`)
}

// 6. No lifecycle scripts: a prepare makes pnpm block the install pending an
// allowBuilds key. ("build" and "test" are fine.)
const bannedScripts = ['prepare', 'prepack', 'postinstall', 'install', 'prepublishOnly']
const presentScripts = bannedScripts.filter(name => pkg.scripts && pkg.scripts[name] !== undefined)
if (presentScripts.length > 0) {
  failures.push(`package.json scripts must not contain lifecycle hook(s): ${presentScripts.join(', ')} — a prepare makes pnpm block the install pending an allowBuilds key`)
}

// 7. .gitignore must not hide shipped artifacts: lib/ and client/ are
// committed on purpose. The file never ships in the pack (pnpm packs by
// `files`), so an installed copy has none — there the rule is satisfied by
// construction and the check exists to guard the dev tree only.
const ignoreLines = fs.existsSync('.gitignore')
  ? fs.readFileSync('.gitignore', 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  : []
const ignoresLib = ignoreLines.includes('lib/')
const ignoresClient = ignoreLines.some(line => /^client\/?$/.test(line))
if (ignoresLib || ignoresClient) {
  failures.push(`.gitignore must not hide shipped artifacts: lib/ and client/ are committed on purpose${ignoresLib ? ' (lib/ found)' : ''}${ignoresClient ? ' (client/ found)' : ''}`)
}

// 8. Vendored ort runtime: queries fail with "no available backend found"
// when any of these is missing from the pack.
for (const file of ['vendor/ort/ort.wasm.bundle.min.mjs', 'vendor/ort/ort-wasm-simd-threaded.mjs', 'vendor/ort/ort-wasm-simd-threaded.wasm']) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
    failures.push(`${file} must exist and be non-empty — queries fail with "no available backend found" without it`)
  }
}

// 9. Index present and real: pnpm does not resolve symlinks when packing by
// "files".
for (const file of ['skills/skills.json', 'skills/vectors.f32']) {
  let stat
  try {
    stat = fs.lstatSync(file)
  }
  catch { }
  if (!stat) {
    failures.push(`${file} must exist — pnpm packs by "files" without resolving symlinks`)
  }
  else if (stat.isSymbolicLink()) {
    failures.push(`${file} must be a real file, not a symlink — pnpm does not resolve symlinks when packing by "files"`)
  }
}

// 10. Model present and substantial enough to be the real weights.
const model = 'model/model_quantized.onnx'
if (!fs.existsSync(model) || fs.statSync(model).size <= 1024 * 1024) {
  failures.push(`${model} must exist and be > 1MB`)
}

// 11. No absolute machine paths baked into shipped text: a hardcoded home
// path breaks on any other machine.
for (const file of ['lib/index.js', 'client/client.js']) {
  const hits = []
  for (const [index, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
    if (line.includes('/home/ryasr')) {
      hits.push(`line ${index + 1}, col ${line.indexOf('/home/ryasr') + 1}: ${line.trim().slice(0, 120)}`)
    }
  }
  if (hits.length > 0) {
    failures.push(`${file} contains the absolute machine path '/home/ryasr':\n  ${hits.join('\n  ')}`)
  }
}

if (failures.length > 0) {
  console.error('preflight failed:\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log(`preflight ok: ${pkg.name}`)
