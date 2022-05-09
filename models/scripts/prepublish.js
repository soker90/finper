/* eslint-disable no-unreachable */
const { spawnSync } = require('child_process');

const registry = spawnSync('npm', ['get', 'registry']).stdout.toString();

if ((/npmjs/).test(registry)) {
  throw new Error('WARNING! - Trying to publish to npm, set your registry properly.');
  process.exit(1);
}
