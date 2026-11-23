import { t } from '../i18n/index.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { isPermanentRefusal } from './cabinet.mjs';
import { loadTrust } from './keys.mjs';

const sameKeys = (a, b) => {
  const list = (entries) =>
    entries
      .map((entry) => entry.publicKey)
      .sort()
      .join();
  return list(a) === list(b);
};

// The developer keys the owner approved in the cabinet, kept fresh while the host runs.
export class CabinetKeys {
  constructor({ fetch, trustFile, log, options }) {
    this.fetch = fetch;
    this.trustFile = trustFile;
    this.log = log;
    this.options = options;
    this.keys = [];
    this.state = '';
    this.checkedAt = 0;
    this.fetchedAt = 0;
    this.skipped = 0;
    this.untrustedWarned = false;
  }

  // ask the cabinet again on the next refresh, whatever the interval
  forget() {
    this.checkedAt = 0;
  }

  async refresh() {
    const now = Date.now();
    if (now - this.checkedAt < this.options.keysRefreshMs) return;
    this.checkedAt = now;
    let fetched;
    try {
      fetched = await this.fetch();
    } catch (error) {
      this.failed(error, now);
      return;
    }
    this.fetchedAt = now;
    this.use(fetched.keys, 'ok');
    if (fetched.skipped && fetched.skipped !== this.skipped) {
      this.log.warn(
        t('the cabinet sent {count} keys that are not Ed25519 public keys; they are not trusted', {
          count: fetched.skipped,
        }),
        {},
        'cabinet-keys-skipped',
      );
    }
    this.skipped = fetched.skipped;
  }

  failed(error, now) {
    if (error?.status === 404) {
      if (this.state !== 'unsupported') {
        this.log.info(
          t('the cabinet hands out no approved keys: only the keys trusted here count'),
          {},
          'cabinet-keys',
        );
      }
      this.use([], 'unsupported');
      return;
    }
    // a key revoked in the cabinet must not stay trusted for long while the cabinet is away
    const lost = isPermanentRefusal(error) || now - this.fetchedAt > this.options.keysStaleMs;
    const state = lost ? 'lost' : 'stale';
    if (this.state !== state) {
      const params = { error: errorMessage(error) };
      this.log.warn(
        lost
          ? t(
              'the keys approved in the cabinet are not trusted until the cabinet hands them out again ({error})',
              params,
            )
          : t(
              'could not refresh the keys approved in the cabinet ({error}); the last list stays for a few minutes',
              params,
            ),
        {},
        'cabinet-keys-failed',
      );
    }
    if (lost) this.use([], state);
    else this.state = state;
  }

  use(keys, state) {
    const changed = state === 'ok' && (this.state !== 'ok' || !sameKeys(keys, this.keys));
    this.keys = keys;
    this.state = state;
    if (changed) {
      this.log.info(
        keys.length
          ? t('keys approved in the cabinet: {count} ({names})', {
              count: keys.length,
              names: keys.map((entry) => entry.name).join(', '),
            })
          : t('no keys are approved in the cabinet for this server'),
        { keys: keys.map(({ name, publicKey, accountId }) => ({ name, publicKey, accountId })) },
        'cabinet-keys',
      );
    }
    this.warnWhenNothingIsTrusted();
  }

  warnWhenNothingIsTrusted() {
    let none = false;
    try {
      none = !this.keys.length && !loadTrust(this.trustFile).length;
    } catch {
      // an unreadable trust file is reported where a request is checked
    }
    if (none && !this.untrustedWarned) {
      this.log.warn(
        t(
          'no trusted keys: every deploy request will be refused (approve a developer key for this server in the cabinet, or add one with varion host trust <key>)',
        ),
      );
    }
    this.untrustedWarned = none;
  }
}
