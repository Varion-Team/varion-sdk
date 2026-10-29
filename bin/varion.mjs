#!/usr/bin/env node
import { t } from '../src/i18n/index.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
  const versions = { required: '22.12', current: process.versions.node };
  process.stderr.write(
    `varion: ${t('needs Node.js {required} or newer (this is {current})', versions)}\n`,
  );
  process.exit(1);
}

const { main } = await import('../src/cli/cli.mjs');
const code = await main(process.argv.slice(2));
process.exitCode = code;
// a bundler service may keep the event loop alive after the command is done
setTimeout(() => process.exit(code), 500).unref();
