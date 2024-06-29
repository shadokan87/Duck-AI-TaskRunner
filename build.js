const { build } = require('esbuild');

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: ['bun'], // Mark 'bun' as external
}).catch(() => process.exit(1));
