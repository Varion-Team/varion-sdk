import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import {
  HOST_BIN,
  taskName,
  taskXml,
  windowsCommandLine,
  writeTaskFile,
} from '../../src/host/autostart.mjs';
import { main } from '../../src/host/cli.mjs';
import { saveHostToken } from '../../src/host/pairing.mjs';
import { defaultRoot } from '../../src/host/paths.mjs';
import { removeDir, tempDir } from './fixtures/fixtures.mjs';

const work = tempDir('varion-host-install-');
const TOKEN = `varion_srv_${'d'.repeat(64)}`;

after(() => removeDir(work));

function fakeSystem({ platform = 'win32', elevated = true } = {}) {
  const tasks = new Map();
  const calls = [];
  return {
    tasks,
    calls,
    platform,
    elevated: () => elevated,
    hasTask: (name) => tasks.has(name),
    createTask(name, xml) {
      calls.push(['create', name]);
      tasks.set(name, xml);
    },
    runTask(name) {
      calls.push(['run', name]);
      return true;
    },
    deleteTask(name) {
      calls.push(['delete', name]);
      tasks.delete(name);
    },
  };
}

async function host(args, system) {
  let text = '';
  const out = { write: (chunk) => (text += chunk) };
  const code = await main(args, { out, err: out, system });
  return { code, text };
}

const unescapeXml = (text) => text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
const taskArguments = (xml) => unescapeXml(/<Arguments>(.*)<\/Arguments>/.exec(xml)[1]);

async function pairedRoot(name) {
  const root = path.join(work, name);
  await saveHostToken(path.join(root, 'host-token.json'), {
    cabinet: 'https://cabinet.example',
    token: TOKEN,
    serverId: 'srv-1',
    serverName: 'Arena',
  });
  return root;
}

describe('varion host install', () => {
  it('quotes a command line the way Windows reads it back', () => {
    const args = ['C:\\Varion & Co\\host\\', 'say "hi"', 'a\\"b', '', 'plain', 'x y'];
    assert.equal(
      windowsCommandLine(args),
      '"C:\\Varion & Co\\host\\\\" "say \\"hi\\"" "a\\\\\\"b" "" plain "x y"',
    );
    if (process.platform === 'win32') {
      const echo = 'console.log(JSON.stringify(process.argv.slice(1)))';
      const result = spawnSync(process.execPath, [windowsCommandLine(['-e', echo, ...args])], {
        argv0: windowsCommandLine([process.execPath]),
        encoding: 'utf8',
        windowsVerbatimArguments: true,
      });
      assert.deepEqual(JSON.parse(result.stdout || 'null'), args, result.stderr);
    }
  });

  it('the task starts with Windows, as SYSTEM, without a time limit or a battery rule', () => {
    const xml = taskXml({
      command: 'C:\\Program Files\\nodejs\\node.exe',
      args: [HOST_BIN, 'run', '--root', 'C:\\Varion & Co\\host'],
      cwd: 'C:\\Varion & Co\\host',
      description: 'varion host <test>',
    });
    for (const part of [
      '<BootTrigger>',
      '<UserId>S-1-5-18</UserId>',
      '<ExecutionTimeLimit>PT0S</ExecutionTimeLimit>',
      '<DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>',
      '<StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>',
      '<MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>',
      '<Command>C:\\Program Files\\nodejs\\node.exe</Command>',
      '<WorkingDirectory>C:\\Varion &#38; Co\\host</WorkingDirectory>',
      '<Description>varion host &#60;test&#62;</Description>',
    ]) {
      assert.ok(xml.includes(part), part);
    }
    assert.equal(
      taskArguments(xml),
      windowsCommandLine([HOST_BIN, 'run', '--root', 'C:\\Varion & Co\\host']),
    );
    const file = path.join(work, 'task.xml');
    writeTaskFile(file, xml);
    const bytes = fs.readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 2)], [0xff, 0xfe]);
    assert.equal(bytes.subarray(2).toString('utf16le'), xml);
  });

  it('installs a task that runs varion host for this folder and starts it; the token stays in the folder', async () => {
    const root = await pairedRoot('host one');
    const system = fakeSystem();
    const { code, text } = await host(
      ['install', '--root', root, '--server-id', 'srv-1', '--preview-ports', '7962-7999'],
      system,
    );
    assert.equal(code, 0, text);
    const name = taskName(root);
    assert.match(name, /^Varion Host [0-9a-f]{8}$/);
    assert.deepEqual(system.calls, [
      ['create', name],
      ['run', name],
    ]);
    const xml = system.tasks.get(name);
    assert.equal(unescapeXml(/<Command>(.*)<\/Command>/.exec(xml)[1]), process.execPath);
    assert.equal(
      taskArguments(xml),
      windowsCommandLine([
        HOST_BIN,
        'run',
        '--root',
        root,
        '--server-id',
        'srv-1',
        '--preview-ports',
        '7962-7999',
      ]),
    );
    assert.ok(!xml.includes(TOKEN) && !text.includes(TOKEN), 'the token stays in the host folder');
    assert.ok(text.includes(name));
    assert.ok(text.includes(`varion host uninstall --root "${root}"`));
    assert.ok(text.includes(`schtasks /Delete /TN "${name}" /F`));
  });

  it('with --token-file the task names the file and the cabinet, never the token', async () => {
    const tokenFile = path.join(work, 'token.txt');
    fs.writeFileSync(tokenFile, 'varion_srv_secret_value_0123456789\n');
    const root = path.join(work, 'host two');
    const system = fakeSystem();
    const { code, text } = await host(
      [
        'install',
        '--root',
        root,
        '--token-file',
        tokenFile,
        '--cabinet',
        'https://cabinet.example',
      ],
      system,
    );
    assert.equal(code, 0, text);
    const xml = system.tasks.get(taskName(root));
    assert.equal(
      taskArguments(xml),
      windowsCommandLine([
        HOST_BIN,
        'run',
        '--root',
        root,
        '--token-file',
        tokenFile,
        '--cabinet',
        'https://cabinet.example',
      ]),
    );
    assert.ok(!xml.includes('secret_value'));
  });

  it('refuses a token on the command line, a terminal without admin rights and other systems', async () => {
    const root = await pairedRoot('host three');
    const refused = async (args, system, exitCode, pattern) => {
      const { code, text } = await host(['install', '--root', root, ...args], system);
      assert.equal(code, exitCode, text);
      assert.match(text, pattern);
      assert.deepEqual(system.calls, []);
    };
    await refused(['--token', TOKEN], fakeSystem(), 2, /--token-file/);
    await refused([], fakeSystem({ elevated: false }), 1, /administrator/);
    await refused([], fakeSystem({ platform: 'linux' }), 2, /systemd/);
    await refused(['--preview-ttl', 'soon'], fakeSystem(), 2, /--preview-ttl/);
  });

  it('uninstall removes the task, and says when there is none', async () => {
    const root = await pairedRoot('host four');
    const system = fakeSystem();
    assert.equal((await host(['install', '--root', root], system)).code, 0);
    const removed = await host(['uninstall', '--root', root], system);
    assert.equal(removed.code, 0, removed.text);
    assert.deepEqual(system.calls.at(-1), ['delete', taskName(root)]);
    assert.match(removed.text, /no longer starts with Windows/);
    const again = await host(['uninstall', '--root', root], system);
    assert.equal(again.code, 0);
    assert.match(again.text, /nothing to remove/);
  });

  it('the default host folder has the plain task name', () => {
    assert.equal(taskName(defaultRoot()), 'Varion Host');
    assert.equal(taskName(defaultRoot().toUpperCase()), 'Varion Host');
    assert.equal(taskName(path.join(work, 'x')), taskName(path.join(work, 'x')));
  });
});
