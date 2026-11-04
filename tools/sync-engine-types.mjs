import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const TYPE_FILES = ['varion-server.d.ts', 'varion-client.d.ts', 'varion-natives.d.ts'];
export const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

// Read every source before changing the SDK. An incomplete engine checkout must
// not replace only part of its declarations.
export function syncEngineTypes({ engineRoot, sdkRoot, check = false }) {
  const version = JSON.parse(fs.readFileSync(path.join(engineRoot, 'version.json'), 'utf8'));
  if (
    typeof version.version !== 'string' ||
    !Number.isSafeInteger(version.protocol) ||
    !Number.isSafeInteger(version.gtaBuild)
  )
    throw new Error('Invalid engine version.json');
  const sources = TYPE_FILES.map((name) => {
    const bytes = fs.readFileSync(path.join(engineRoot, 'sdk', 'types', name));
    if (!bytes.length) throw new Error(`Empty engine declaration: ${name}`);
    return { name, bytes };
  });
  const manifest = {
    schemaVersion: 1,
    engineVersion: version.version,
    protocol: version.protocol,
    gtaBuild: version.gtaBuild,
    files: Object.fromEntries(sources.map(({ name, bytes }) => [name, sha256(bytes)])),
  };
  const entries = [
    ...sources,
    {
      name: 'engine.json',
      bytes: Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
    },
  ];
  if (check) {
    const stale = entries
      .filter(({ name, bytes }) => {
        const target = path.join(sdkRoot, 'types', name);
        return !fs.existsSync(target) || !fs.readFileSync(target).equals(bytes);
      })
      .map(({ name }) => name);
    if (stale.length) throw new Error(`SDK types differ from the engine: ${stale.join(', ')}`);
  } else {
    fs.mkdirSync(path.join(sdkRoot, 'types'), { recursive: true });
    for (const { name, bytes } of entries)
      fs.writeFileSync(path.join(sdkRoot, 'types', name), bytes);
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const engineIndex = args.indexOf('--engine');
  const allowed = args.filter((_, i) => i !== engineIndex && i !== engineIndex + 1);
  if (engineIndex < 0 || !args[engineIndex + 1] || allowed.some((arg) => arg !== '--check')) {
    process.stderr.write(
      'Usage: node tools/sync-engine-types.mjs --engine <engine-root> [--check]\n',
    );
    process.exitCode = 1;
  } else {
    try {
      const sdkRoot = fileURLToPath(new URL('../', import.meta.url));
      const manifest = syncEngineTypes({
        engineRoot: path.resolve(args[engineIndex + 1]),
        sdkRoot,
        check: args.includes('--check'),
      });
      process.stdout.write(
        `SDK types: engine ${manifest.engineVersion}, protocol ${manifest.protocol}, GTA ${manifest.gtaBuild}: OK\n`,
      );
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
