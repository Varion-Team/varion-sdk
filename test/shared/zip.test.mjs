import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { sha256 } from '../../src/shared/fs.mjs';
import { checkEntryPath, extractZip, openZip, ZipError, ZipWriter } from '../../src/shared/zip.mjs';
import { buildZip } from '../host/fixtures/zip-writer.mjs';

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-zip-test-'));
after(() => fs.rmSync(work, { recursive: true, force: true, maxRetries: 5 }));

let counter = 0;
const nextPath = (name) => path.join(work, `${counter++}-${name}`);

function zipFile(entries, options) {
  const file = nextPath('test.zip');
  fs.writeFileSync(file, buildZip(entries, options));
  return file;
}

async function withZip(file, use) {
  const zip = await openZip(file);
  try {
    return await use(zip);
  } finally {
    await zip.close();
  }
}

describe('checkEntryPath', () => {
  it('accepts portable relative paths', () => {
    assert.deepEqual(checkEntryPath('resources/a/server/main.js'), {
      path: 'resources/a/server/main.js',
      directory: false,
    });
    assert.deepEqual(checkEntryPath('resources/a/'), { path: 'resources/a', directory: true });
    assert.equal(
      checkEntryPath('resources/а-кириллица/файл.js').path,
      'resources/а-кириллица/файл.js',
    );
    assert.equal(checkEntryPath('.htaccess').path, '.htaccess');
  });

  it('reads backslashes as separators only when asked to', () => {
    assert.throws(() => checkEntryPath('Varion-Server\\host\\a.js'), ZipError);
    assert.equal(
      checkEntryPath('Varion-Server\\host\\a.js', { windowsSeparators: true }).path,
      'Varion-Server/host/a.js',
    );
    assert.throws(() => checkEntryPath('a\\..\\..\\b', { windowsSeparators: true }), ZipError);
  });

  for (const bad of [
    '../evil.js',
    'resources/../../evil.js',
    'resources/./x',
    '/etc/passwd',
    'C:/Windows/x',
    'C:evil',
    'resources\\..\\evil',
    'resources//double',
    'file.txt:stream',
    'resources/CON',
    'resources/nul.txt',
    'resources/com1.js',
    'resources/LPT9',
    'resources/trailing.',
    'resources/trailing ',
    'resources/PROGRA~1/x',
    `a${String.fromCharCode(0)}b`,
    `a${String.fromCharCode(0x1f)}b`,
    'a<b',
    'a|b',
    'a?b',
    'a*b',
    '',
  ]) {
    it(`refuses ${JSON.stringify(bad)}`, () => assert.throws(() => checkEntryPath(bad), ZipError));
  }

  it('refuses paths deeper than the server allows', () => {
    assert.throws(() => checkEntryPath(Array.from({ length: 65 }, () => 'd').join('/')), ZipError);
  });
});

describe('openZip', () => {
  it('reads stored and deflated entries and checks size and SHA-256', async () => {
    const big = Buffer.from('x'.repeat(10_000));
    const file = zipFile([
      { name: 'a.txt', data: 'hello', method: 0 },
      { name: 'dir/b.bin', data: big, method: 8 },
    ]);
    await withZip(file, async (zip) => {
      assert.deepEqual(
        zip.entries.map((entry) => entry.name),
        ['a.txt', 'dir/b.bin'],
      );
      const target = nextPath('b.bin');
      const result = await zip.extractTo(zip.entries[1], target, {
        expectedSize: big.length,
        expectedSha256: sha256(big),
      });
      assert.equal(result.sha256, sha256(big));
      assert.deepEqual(fs.readFileSync(target), big);
      assert.equal((await zip.readBuffer(zip.entries[0], 100)).toString(), 'hello');
    });
  });

  it('reads ZIP64 sizes and offsets', async () => {
    const file = zipFile([{ name: 'z.txt', data: 'zip64 data', method: 8 }], { zip64: true });
    await withZip(file, async (zip) => {
      assert.equal(zip.entries[0].size, 10);
      assert.equal((await zip.readBuffer(zip.entries[0], 100)).toString(), 'zip64 data');
    });
  });

  it('removes the partial file on a SHA-256 mismatch', async () => {
    const target = nextPath('mismatch.txt');
    await withZip(zipFile([{ name: 'a.txt', data: 'hello' }]), async (zip) => {
      await assert.rejects(
        zip.extractTo(zip.entries[0], target, { expectedSize: 5, expectedSha256: sha256('other') }),
        /SHA-256/,
      );
    });
    assert.equal(fs.existsSync(target), false);
  });

  it('stops inflating at the declared size (a zip bomb lies about its size)', async () => {
    const data = Buffer.alloc(1 << 20, 0x41);
    const target = nextPath('bomb.bin');
    await withZip(
      zipFile([{ name: 'bomb.bin', data, method: 8, declaredSize: 1000 }]),
      async (zip) => {
        await assert.rejects(
          zip.extractTo(zip.entries[0], target, { expectedSize: 1000 }),
          /more than its declared size/,
        );
      },
    );
    assert.equal(fs.existsSync(target), false);
  });

  it('refuses an existing target instead of overwriting it', async () => {
    const target = nextPath('exists.txt');
    fs.writeFileSync(target, 'keep me');
    await withZip(zipFile([{ name: 'a.txt', data: 'hello' }]), async (zip) => {
      await assert.rejects(zip.extractTo(zip.entries[0], target, { expectedSize: 5 }), {
        code: 'EEXIST',
      });
    });
    assert.equal(fs.readFileSync(target, 'utf8'), 'keep me');
  });

  it('refuses encrypted entries, links and a local name that differs from the central one', async () => {
    for (const [entry, pattern] of [
      [{ name: 'e.txt', data: 'x', encrypted: true }, /encrypted/],
      [{ name: 'link', data: '/etc/passwd', unixMode: 0o120777 }, /a link or a special file/],
      [{ name: 'good.txt', localName: '../evil.txt', data: 'x' }, /headers differ/],
    ]) {
      await withZip(zipFile([entry]), async (zip) => {
        await assert.rejects(
          zip.extractTo(zip.entries[0], nextPath('bad'), { expectedSize: zip.entries[0].size }),
          pattern,
        );
      });
    }
  });

  it('refuses names that are not UTF-8 without the UTF-8 flag', async () => {
    const zip = buildZip([{ name: 'xx.txt', data: 'x', utf8: false }]);
    for (let at = zip.indexOf('xx.txt'); at >= 0; at = zip.indexOf('xx.txt', at + 1))
      zip[at] = 0xe9;
    const file = nextPath('latin1.zip');
    fs.writeFileSync(file, zip);
    await assert.rejects(openZip(file), /UTF-8/);
  });

  it('refuses something that is not a zip', async () => {
    const file = nextPath('not.zip');
    fs.writeFileSync(file, 'plain text, long enough to have no end record at all..........');
    await assert.rejects(openZip(file), /not a ZIP archive/);
  });

  it('fails an entry whose bytes do not match its CRC', async () => {
    const file = nextPath('crc.zip');
    const writer = new ZipWriter(file);
    writer.addBuffer('a.bin', Buffer.from('hello world, stored as is'), { compress: false });
    writer.close();
    const bytes = fs.readFileSync(file);
    bytes[bytes.indexOf(Buffer.from('hello'))] ^= 0xff;
    fs.writeFileSync(file, bytes);
    await withZip(file, async (zip) => {
      await assert.rejects(zip.readBuffer(zip.entries[0], 1000), /CRC differs/);
    });
  });
});

describe('ZipWriter and extractZip', () => {
  it('round-trips deflated, stored, streamed and non-ASCII entries', async () => {
    const big = nextPath('pack.rpf');
    fs.writeFileSync(big, crypto.randomBytes(3 << 20));
    const file = nextPath('out.zip');
    const writer = new ZipWriter(file, { date: new Date('2026-10-28T12:00:00Z') });
    writer.addBuffer('release.json', Buffer.from('{"format":1}'));
    writer.addBuffer('resources/демо/ui/index.html', Buffer.from('<p>'.repeat(1000)));
    writer.addFile('resources/rp/dlc.rpf', big);
    writer.close();

    await withZip(file, async (zip) => {
      assert.deepEqual(
        zip.entries.map((entry) => [entry.name, entry.method]),
        [
          ['release.json', 0],
          ['resources/демо/ui/index.html', 8],
          ['resources/rp/dlc.rpf', 0],
        ],
      );
      assert.equal((await zip.readBuffer(zip.entries[0], 100)).toString(), '{"format":1}');
    });

    const out = nextPath('out');
    const written = await extractZip(file, out, { stripRoot: false });
    assert.deepEqual(written, [
      'release.json',
      'resources/демо/ui/index.html',
      'resources/rp/dlc.rpf',
    ]);
    assert.ok(
      fs.readFileSync(path.join(out, 'resources', 'rp', 'dlc.rpf')).equals(fs.readFileSync(big)),
    );
  });

  it('drops a single top folder and reads Windows separators', async () => {
    const file = nextPath('pkg.zip');
    const writer = new ZipWriter(file);
    writer.addBuffer('mariadb-11.8.9-winx64\\bin\\', Buffer.alloc(0));
    writer.addBuffer('mariadb-11.8.9-winx64\\bin\\mariadbd.exe', Buffer.from('exe'));
    writer.addBuffer('mariadb-11.8.9-winx64\\README.md', Buffer.from('readme'));
    writer.close();
    const out = nextPath('pkg');
    assert.deepEqual((await extractZip(file, out)).sort(), ['README.md', 'bin/mariadbd.exe']);
    assert.equal(fs.readFileSync(path.join(out, 'bin', 'mariadbd.exe'), 'utf8'), 'exe');
  });

  it('refuses names that leave the target folder, before writing anything', async () => {
    for (const name of ['../evil.txt', '/abs.txt', 'C:/win.txt', 'a/../../b.txt']) {
      const file = nextPath('bad.zip');
      const writer = new ZipWriter(file);
      writer.addBuffer('fine.txt', Buffer.from('x'));
      writer.addBuffer(name, Buffer.from('x'));
      writer.close();
      const out = nextPath('bad');
      await assert.rejects(extractZip(file, out), ZipError, name);
      assert.equal(fs.existsSync(path.join(out, 'fine.txt')), false, name);
    }
  });

  it('refuses two names that are one file on Windows', async () => {
    const file = nextPath('twice.zip');
    const writer = new ZipWriter(file);
    writer.addBuffer('Readme.txt', Buffer.from('a'));
    writer.addBuffer('README.txt', Buffer.from('b'));
    writer.close();
    await assert.rejects(extractZip(file, nextPath('twice'), { stripRoot: false }), /twice/);
  });
});
