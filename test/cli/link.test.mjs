import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withListing } from '../../src/cli/commands/link.mjs';
import { parseToml } from '../../src/cli/toml.mjs';

const URL = 'https://api.example.test/api';

describe('varion link: what it writes into server.toml', () => {
  it('adds the two keys among the top-level ones and touches nothing else', () => {
    const before = 'name = "Mode"\nport = 7788\n\n[config]\nwelcome = "hi"\n';
    const after = withListing(before, URL);
    assert.equal(
      after,
      `name = "Mode"\nport = 7788\nannounce = true\nmasterListUrl = "${URL}"\n\n[config]\nwelcome = "hi"\n`,
    );
    assert.deepEqual(parseToml(after), {
      name: 'Mode',
      port: 7788,
      announce: true,
      masterListUrl: URL,
      config: { welcome: 'hi' },
    });
  });

  it('rewrites the keys that are there, and a key of the same name inside a table is not one of them', () => {
    const before =
      'announce = false\nmasterListUrl = ""\n\n[config]\nannounce = "to the players"\n';
    const parsed = parseToml(withListing(before, URL));
    assert.deepEqual(parsed, {
      announce: true,
      masterListUrl: URL,
      config: { announce: 'to the players' },
    });
    // running it again changes nothing
    assert.equal(withListing(withListing(before, URL), URL), withListing(before, URL));
  });

  it('keeps Windows line ends and works on a file without tables', () => {
    const after = withListing('name = "Mode"\r\nport = 7788\r\n', URL);
    assert.equal(
      after,
      `name = "Mode"\r\nport = 7788\r\nannounce = true\r\nmasterListUrl = "${URL}"\r\n`,
    );
  });
});
