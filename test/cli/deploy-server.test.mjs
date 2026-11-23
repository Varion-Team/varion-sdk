import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { findDeployServer, serversFor, withDeployServer } from '../../src/cli/deploy-server.mjs';
import { parseToml } from '../../src/cli/toml.mjs';

const one = { id: 'srv-1', name: 'Sunrise RP', deployTest: true, deployProd: true };
const two = { id: 'srv-2', name: 'Night City', deployTest: true, deployProd: false };
const output = () => {
  const lines = [];
  return { lines, info: (line) => lines.push(line) };
};

function projectWith(toml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varion-deploy-server-'));
  fs.writeFileSync(path.join(root, 'varion.toml'), toml);
  return { root, read: () => fs.readFileSync(path.join(root, 'varion.toml'), 'utf8') };
}

describe('the server a deploy goes to', () => {
  it('is among those the account may deploy this environment to', () => {
    assert.deepEqual(serversFor([one, two], 'prod'), [one]);
    assert.deepEqual(serversFor([one, two], 'test'), [one, two]);
  });

  it('is never one whose id could write something else into varion.toml', () => {
    const forged = { ...one, id: 'x"\n[build.steps.evil]\nrun = "calc.exe' };
    assert.deepEqual(serversFor([forged, { ...one, id: '' }, { ...one, id: 'a b' }], 'prod'), []);
    // a server the cabinet sent without an id is not one either
    const nameless = { name: one.name, deployTest: true, deployProd: true };
    assert.deepEqual(serversFor([nameless, { ...one, id: null }], 'prod'), []);
    assert.deepEqual(serversFor([{ ...one, id: 42 }], 'prod').length, 1);
    // and whatever is written is written as one TOML string
    const written = parseToml(withDeployServer('[project]\nname = "m"\n', 'prod', forged.id));
    assert.equal(written.deploy.prod.server, forged.id);
    assert.equal(written.build, undefined);
  });

  it('is written into varion.toml without touching the rest of it', () => {
    const base = '[project]\nname = "mode"\n\n[server]\nport = 7788\n';
    const added = withDeployServer(base, 'prod', 'srv-1');
    assert.equal(added, `${base}\n[deploy.prod]\nserver = "srv-1"\n`);
    assert.equal(parseToml(added).deploy.prod.server, 'srv-1');
    const inTable = withDeployServer(
      '[deploy.prod]\ncabinet = "https://c.test"\n\n[server]\nport = 1\n',
      'prod',
      'srv-1',
    );
    assert.deepEqual(parseToml(inTable).deploy.prod, {
      server: 'srv-1',
      cabinet: 'https://c.test',
    });
    assert.equal(parseToml(inTable).server.port, 1);
    assert.equal(parseToml(withDeployServer(inTable, 'prod', 'srv-9')).deploy.prod.server, 'srv-9');
    assert.match(
      withDeployServer('[project]\r\nname = "m"\r\n', 'test', 'srv-2'),
      /\r\n\[deploy\.test\]\r\nserver = "srv-2"\r\n$/,
    );
  });

  it('the only one is taken and remembered; several are asked about once; none says what to do', async () => {
    const project = projectWith('[project]\nname = "mode"\n');
    try {
      const login = { token: `varion_cli_${'a'.repeat(64)}` };
      const say = output();
      const base = { project, login, cabinetUrl: 'https://c.test', output: say };
      const both = async () => ({ servers: [one, two] });
      const id = await findDeployServer({
        ...base,
        env: 'prod',
        interactive: false,
        account: both,
      });
      assert.equal(id, 'srv-1');
      assert.equal(parseToml(project.read()).deploy.prod.server, 'srv-1');
      assert.equal(say.lines.length, 1);

      await assert.rejects(
        findDeployServer({ ...base, env: 'test', interactive: false, account: both }),
        (error) =>
          error.code === 'several_servers' &&
          /srv-1/.test(error.message) &&
          /srv-2/.test(error.message),
      );
      const picked = await findDeployServer({
        ...base,
        env: 'test',
        interactive: true,
        ask: async (servers) => servers[1],
        account: both,
      });
      assert.equal(picked, 'srv-2');
      assert.deepEqual(parseToml(project.read()).deploy, {
        prod: { server: 'srv-1' },
        test: { server: 'srv-2' },
      });

      const none = async () => ({ servers: [] });
      const noRight = async () => ({ servers: [two] });
      await assert.rejects(
        findDeployServer({ ...base, env: 'prod', interactive: true, account: none }),
        (error) => error.code === 'no_server',
      );
      await assert.rejects(
        findDeployServer({ ...base, env: 'prod', interactive: true, account: noRight }),
        (error) => error.code === 'no_server',
      );
    } finally {
      fs.rmSync(project.root, { recursive: true, force: true });
    }
  });
});
