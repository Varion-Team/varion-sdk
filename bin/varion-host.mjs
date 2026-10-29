#!/usr/bin/env node
import { t } from '../src/i18n/index.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  const versions = { required: '22.12', current: process.versions.node };
  process.stderr.write(
    `varion host: ${t('needs Node.js {required} or newer (this is {current})', versions)}\n`,
  );
  process.exit(1);
}

const { main } = await import('../src/host/cli.mjs');
const code = await main(process.argv.slice(2));
process.exitCode = code;
// a held poll socket must not keep a finished command alive
setTimeout(() => process.exit(code), 300).unref();
