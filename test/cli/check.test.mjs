import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import { main } from '../../src/cli/cli.mjs';
import { generateProject } from '../../src/cli/scaffold.mjs';
import { CLI_DIR, cleanupTempDirs, tempDir } from './helpers.mjs';

after(cleanupTempDirs);

for (const kind of ['missing', 'directory']) {
  test(`check reports a ${kind} server entry before invoking TypeScript`, async () => {
    const dir = path.join(tempDir(), 'city');
    generateProject({
      dir,
      name: 'city',
      title: 'City',
      port: 7788,
      engine: { version: '1.0.76', channel: 'rc' },
      sdkDir: CLI_DIR,
    });
    const entry = path.join(dir, 'src', 'server', 'index.ts');
    fs.unlinkSync(entry);
    if (kind === 'directory') fs.mkdirSync(entry);
    let stdout = '';
    let stderr = '';
    const code = await main(['check', '-C', dir, '--json'], {
      stdout: {
        write: (text) => {
          stdout += text;
        },
      },
      stderr: {
        write: (text) => {
          stderr += text;
        },
      },
    });
    assert.equal(code, 1, stderr);
    const events = stdout
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line));
    const fatal = events.find((event) => event.type === 'fatal');
    assert.match(fatal?.text || '', /server entry is not a file/);
    assert.match(fatal.text, /src[\\/]server[\\/]index\.ts/);
  });
}
