const { build } = require('esbuild')
const { Generator } = require('npm-dts')

const { dependencies, peerDependencies } = require('./package.json')

const shared = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist',
  bundle: true,
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies))
}

build({
  ...shared,
  outfile: 'dist/index.js',
  target: ['esnext', 'node16']
})

build({
  ...shared,
  outfile: 'dist/index.esm.js',
  format: 'esm',
  target: ['esnext', 'node16']
})

new Generator({
  entry: 'src/index.ts',
  output: 'dist/index.d.ts'
}).generate()
