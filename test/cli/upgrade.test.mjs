import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { addDevDependency, newerThan, withEngineVersion } from '../../src/cli/commands/upgrade.mjs';
import { parseToml } from '../../src/cli/toml.mjs';
import { projectPackageManager, runPackageManager } from '../../src/cli/tools.mjs';

describe('varion upgrade: the engine version in varion.toml', () => {
  it('changes the version of [engine] and nothing else', () => {
    const before =
      'name = "mode"\nversion = "0.1.0"\n\n[engine]\n# from the CDN\nversion = "1.0.90" # pinned\nchannel = "rc"\n\n[server]\nversion = "x"\n';
    const after = withEngineVersion(before, '1.0.95');
    assert.equal(after, before.replace('"1.0.90"', '"1.0.95"'));
    assert.equal(parseToml(after).engine.version, '1.0.95');
    assert.equal(parseToml(after).version, '0.1.0');
    assert.equal(parseToml(after).server.version, 'x');
  });

  it('keeps Windows line ends', () => {
    const after = withEngineVersion('[engine]\r\nversion = "1.0.1"\r\n', '1.0.2');
    assert.equal(after, '[engine]\r\nversion = "1.0.2"\r\n');
  });

  it('an engine by path, or no [engine], has no version to change', () => {
    assert.equal(
      withEngineVersion('[engine]\npath = "C:/build"\n\n[server]\nversion = "1"\n', '1.0.2'),
      null,
    );
    assert.equal(withEngineVersion('version = "1.0.0"\n', '1.0.2'), null);
  });

  it('compares versions by number, not by text', () => {
    assert.equal(newerThan('1.0.100', '1.0.95'), true);
    assert.equal(newerThan('1.0.95', '1.0.100'), false);
    assert.equal(newerThan('1.1.0', '1.0.95'), true);
    assert.equal(newerThan('1.0.95', '1.0.95'), false);
  });
});

describe('varion upgrade: npm', () => {
  // On Windows npm is a .cmd, and node refuses to start one directly.
  it('is started the way this platform lets it', async () => {
    const answer = await runPackageManager('npm', ['--version'], { stdio: 'pipe' });
    assert.equal(answer.code, 0, answer.output);
    assert.match(answer.output.trim(), /^\d+\.\d+\.\d+/);
  });
});

describe('varion upgrade: the package manager of the project', () => {
  it('is the one whose lock file the project keeps', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-upgrade-pm-'));
    try {
      assert.equal(projectPackageManager(dir), 'npm');
      fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
      assert.equal(projectPackageManager(dir), 'yarn');
      fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
      assert.equal(projectPackageManager(dir), 'pnpm');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('adds the SDK as a development dependency in the words of each one', () => {
    const spec = 'github:Varion-Team/varion-sdk';
    assert.deepEqual(addDevDependency('npm', spec), ['install', '--save-dev', spec]);
    assert.deepEqual(addDevDependency('pnpm', spec), ['add', '-D', spec]);
    assert.deepEqual(addDevDependency('yarn', spec), ['add', '-D', spec]);
  });
});
