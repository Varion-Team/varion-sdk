// What a deploy request and a release are made of. The developer's side and the host check
// them by the same rules.
export const DEPLOY_ENV = /^(test|prod|preview-[a-z0-9][a-z0-9._-]{0,62})$/;
export const RELEASE_ID = /^\d{8}-\d{6}-[0-9a-f]{8}$/;
export const PROJECT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const SERVER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
export const SHA256 = /^[0-9a-f]{64}$/;
export const FINAL = new Set(['active', 'failed', 'rolled-back']);
export const ED25519_SPKI = Buffer.from('302a300506032b6570032100', 'hex');
