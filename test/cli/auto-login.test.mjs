import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { canAskToSignIn, ensureSignedIn } from '../../src/cli/commands/login.mjs';
import { saveLogin } from '../../src/deploy/client.mjs';

const CABINET = 'https://cabinet.example.test';

function withConfigDir(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-auto-login-'));
  try {
    return run({ VARION_CONFIG_DIR: dir });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('a command that needs the sign-in', () => {
  it('uses the saved sign-in of this computer without asking', async () => {
    await withConfigDir(async (env) => {
      const token = `varion_cli_${'a'.repeat(64)}`;
      saveLogin(CABINET, { token, account: { id: 'acc', name: 'Owner' } }, { env });
      const root = { child: () => assert.fail('nothing is said when the computer is signed in') };
      assert.equal((await ensureSignedIn(CABINET, root, { env })).token, token);
    });
  });

  it('does not open a browser where nobody can confirm: CI, a pipe, VARION_NO_SIGN_IN', async () => {
    const tty = { stdin: process.stdin.isTTY, stdout: process.stdout.isTTY };
    try {
      process.stdin.isTTY = true;
      process.stdout.isTTY = true;
      assert.equal(canAskToSignIn({}), true);
      assert.equal(canAskToSignIn({ CI: 'true' }), false);
      assert.equal(canAskToSignIn({ VARION_NO_SIGN_IN: '1' }), false);
      process.stdout.isTTY = false;
      assert.equal(canAskToSignIn({}), false);
      await withConfigDir(async (env) => {
        const root = { child: () => assert.fail('a pipe is not asked to sign in') };
        assert.equal(await ensureSignedIn(CABINET, root, { env }), null);
      });
    } finally {
      process.stdin.isTTY = tty.stdin;
      process.stdout.isTTY = tty.stdout;
    }
  });
});
