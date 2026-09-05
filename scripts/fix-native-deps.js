#!/usr/bin/env node
/**
 * better-sqlite3 ships a version-locked native addon (unlike bcrypt, which
 * uses N-API and is ABI-stable across Node versions). If the active Node
 * version changes after `pnpm install` (e.g. via fnm/nvm), the previously
 * built/fetched binary stops matching and the process crashes at startup
 * with a native assertion instead of a clear JS error.
 *
 * This script re-fetches the official prebuilt binary for the currently
 * active Node ABI via `prebuild-install` (the same tool better-sqlite3's own
 * `install` script uses), without needing to recompile with node-gyp.
 * Safe to run anytime; it's a no-op if the binary already matches.
 */
const path = require('path')

const resolvePackageDir = (name, fromDir) => {
  const pkgJsonPath = require.resolve(`${name}/package.json`, { paths: [fromDir] })
  return path.dirname(pkgJsonPath)
}

const run = () => {
  const dbPackageDir = path.join(process.cwd(), 'packages', 'db')
  const betterSqlite3Dir = resolvePackageDir('better-sqlite3', dbPackageDir)
  const prebuildInstallBin = require.resolve('prebuild-install/bin.js', { paths: [betterSqlite3Dir] })

  process.chdir(betterSqlite3Dir)
  process.argv = [process.argv[0], prebuildInstallBin, '--verbose']
  require(prebuildInstallBin)
}

run()
