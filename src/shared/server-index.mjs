import { t } from '../i18n/index.mjs';
import { DEFAULT_CDN, RELEASE_KEY, verifyManifestSignature } from './engine.mjs';
import { VarionError } from './errors.mjs';
import { sha256 } from './fs.mjs';
import { request } from './http.mjs';

export const SDK_TYPE_FILES = ['varion-server.d.ts', 'varion-client.d.ts', 'varion-natives.d.ts'];
const VERSION = /^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,5})$/;
const MAX_TYPE_BYTES = 8 << 20;

export function serverIndexClient({
  cdn = process.env.VARION_CDN || DEFAULT_CDN,
  key = RELEASE_KEY,
} = {}) {
  const base = cdn.replace(/\/+$/, '');
  const get = (url, maxBytes) =>
    request(url, { maxBytes, timeoutMs: 10_000, what: t('server release') });
  const invalid = (file) =>
    new VarionError(t('server release verification failed for {file}', { file }), {
      code: 'server-index-integrity',
    });
  return {
    async index(channel, version) {
      // Preview channels and legacy pinned versions continue using their explicit package paths.
      if (!['rc', 'release'].includes(channel) || (version && !VERSION.test(version))) return null;
      const route = version
        ? `Varion-Server/${channel}/${version}/index.json`
        : `channels/${channel}/server/index.json`;
      let body;
      try {
        ({ body } = await get(`${base}/${route}`, 64 << 10));
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
      let envelope;
      try {
        envelope = JSON.parse(body);
      } catch {
        throw invalid(route);
      }
      const { manifest, signature } = envelope ?? {};
      if (
        manifest?.schemaVersion !== 1 ||
        manifest.product !== 'varion-server' ||
        manifest.channel !== channel ||
        !VERSION.test(manifest.version) ||
        !Number.isSafeInteger(manifest.protocol) ||
        manifest.protocol < 1 ||
        typeof signature !== 'string' ||
        (version && manifest.version !== version) ||
        !verifyManifestSignature(JSON.stringify(manifest), signature, key)
      )
        throw invalid(route);
      return manifest;
    },
    async types(manifest) {
      const prefix = `${base}/Varion-Server/${manifest.channel}/${manifest.version}/types`;
      const files = await Promise.all(
        SDK_TYPE_FILES.map(async (name) => {
          const route = `${prefix}/${name}`;
          const entry = manifest.files?.[`types/${name}`];
          if (
            !Number.isSafeInteger(entry?.size) ||
            entry.size <= 0 ||
            entry.size > MAX_TYPE_BYTES ||
            !/^[a-f0-9]{64}$/.test(entry.sha256)
          )
            throw invalid(route);
          const { body } = await get(route, entry.size);
          if (body.length !== entry.size || sha256(body) !== entry.sha256) throw invalid(route);
          return [name, body];
        }),
      );
      return { source: prefix, files: new Map(files) };
    },
  };
}
