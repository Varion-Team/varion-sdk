import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  boxFingerprint,
  isBoxPublicKey,
  newBoxKeys,
  openFile,
  sealedSize,
  sealFile,
} from '../../src/shared/box.mjs';

const CHUNK = 64 * 1024;

async function inTemp(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-box-'));
  try {
    return await run((name) => path.join(dir, name));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('a release sealed for the machine of the game server', () => {
  it('opens to the same bytes on that machine, whatever its size', async () => {
    const keys = newBoxKeys();
    assert.equal(isBoxPublicKey(keys.publicKey), true);
    assert.match(boxFingerprint(keys.publicKey), /^box:[0-9a-f]{16}$/);
    await inTemp(async (at) => {
      for (const size of [0, 1, CHUNK - 1, CHUNK, CHUNK + 1, 3 * CHUNK, 3 * CHUNK + 777]) {
        const plain = crypto.randomBytes(size);
        fs.writeFileSync(at('plain'), plain);
        const sealed = await sealFile(at('plain'), at('sealed'), keys.publicKey);
        assert.equal(
          sealed.size,
          sealedSize(size),
          `the sealed size of ${size} bytes is known ahead`,
        );
        const opened = await openFile(at('sealed'), at('opened'), keys.privateKey);
        assert.equal(opened.size, size);
        assert.equal(opened.sha256, crypto.createHash('sha256').update(plain).digest('hex'));
        assert.deepEqual(fs.readFileSync(at('opened')), plain);
      }
    });
  });

  it('shows nothing of what is inside, and two sealings of one file differ', async () => {
    const keys = newBoxKeys();
    await inTemp(async (at) => {
      const plain = Buffer.from('const secret = "server side economy";\n'.repeat(4000));
      fs.writeFileSync(at('plain'), plain);
      await sealFile(at('plain'), at('one'), keys.publicKey);
      await sealFile(at('plain'), at('two'), keys.publicKey);
      const one = fs.readFileSync(at('one'));
      assert.equal(one.includes(Buffer.from('server side economy')), false);
      assert.equal(one.equals(fs.readFileSync(at('two'))), false);
    });
  });

  it('does not open on another machine, when changed, cut short or lengthened', async () => {
    const keys = newBoxKeys();
    const other = newBoxKeys();
    await inTemp(async (at) => {
      fs.writeFileSync(at('plain'), crypto.randomBytes(2 * CHUNK + 100));
      await sealFile(at('plain'), at('sealed'), keys.publicKey);
      const sealed = fs.readFileSync(at('sealed'));
      const refused = async (bytes, key = keys.privateKey) => {
        fs.writeFileSync(at('bad'), bytes);
        await assert.rejects(openFile(at('bad'), at('out'), key), (error) => error.code === 'box');
      };
      await refused(sealed, other.privateKey);
      const flipped = Buffer.from(sealed);
      flipped[sealed.length - 40] ^= 1;
      await refused(flipped);
      // without its last frame, and without the tail of it
      const lastFrame = 4 + 16 + 100;
      await refused(sealed.subarray(0, sealed.length - lastFrame));
      await refused(sealed.subarray(0, sealed.length - 5));
      await refused(Buffer.concat([sealed, sealed.subarray(sealed.length - lastFrame)]));
      await refused(
        Buffer.from(
          'PK\u0003\u0004 a plain zip is not a sealed release, however long it is'.repeat(4),
        ),
      );
      await refused(Buffer.alloc(0));
    });
  });

  it('a key that is not a key is refused before anything is sealed', () => {
    assert.equal(isBoxPublicKey('not-a-key'), false);
    assert.equal(isBoxPublicKey(Buffer.alloc(31).toString('base64')), false);
    assert.equal(isBoxPublicKey(undefined), false);
  });
});
