import { isUtf8 } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { t } from '../i18n/index.mjs';
import { randomTag } from '../shared/fs.mjs';
import { windowsTool } from '../shared/process.mjs';
import { HostError } from './errors.mjs';
import { defaultRoot, samePath } from './paths.mjs';

export const HOST_BIN = fileURLToPath(new URL('../../bin/varion-host.mjs', import.meta.url));
const TASK = 'Varion Host';

export function taskName(root) {
  if (samePath(root, defaultRoot(), 'win32')) return TASK;
  const folder = path.resolve(root).toLowerCase();
  return `${TASK} ${crypto.createHash('sha256').update(folder).digest('hex').slice(0, 8)}`;
}

// quoted the way CommandLineToArgvW reads it back
export function windowsCommandLine(args) {
  return args
    .map((arg) => {
      const text = String(arg);
      if (text && !/[\s"]/.test(text)) return text;
      return `"${text.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`;
    })
    .join(' ');
}

const xmlText = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// schtasks /Create without XML stops a task after 3 days and on battery power
export function taskXml({ command, args, cwd, description }) {
  return `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>${xmlText(description)}</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>5</Priority>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${xmlText(command)}</Command>
      <Arguments>${xmlText(windowsCommandLine(args))}</Arguments>
      <WorkingDirectory>${xmlText(cwd)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`;
}

export function writeTaskFile(file, xml) {
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(xml, 'utf16le')]));
}

// console tools write in the console code page, 866 on a Russian Windows
const consoleText = (bytes) =>
  bytes?.length ? new TextDecoder(isUtf8(bytes) ? 'utf-8' : 'ibm866').decode(bytes).trim() : '';

function schtasks(args) {
  const result = spawnSync(windowsTool('schtasks.exe'), args, {
    windowsHide: true,
    timeout: 60_000,
  });
  const output = [consoleText(result.stdout), consoleText(result.stderr)].filter(Boolean);
  return { code: result.status ?? -1, output: output.join(' ') || String(result.error || '') };
}

export const windowsSystem = {
  platform: process.platform,
  elevated() {
    const result = spawnSync(windowsTool('whoami.exe'), ['/groups', '/fo', 'csv', '/nh'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 20_000,
    });
    return /"S-1-16-(12288|16384)"/.test(result.stdout || '');
  },
  hasTask(name) {
    return schtasks(['/Query', '/TN', name]).code === 0;
  },
  createTask(name, xml) {
    const file = path.join(os.tmpdir(), `varion-host-task-${randomTag()}.xml`);
    writeTaskFile(file, xml);
    try {
      const { code, output } = schtasks(['/Create', '/TN', name, '/XML', file, '/F']);
      if (code !== 0) {
        throw new HostError(
          t('schtasks did not create the task {name} (exit code {code}): {output}', {
            name,
            code,
            output,
          }),
          'schtasks',
        );
      }
    } finally {
      fs.rmSync(file, { force: true });
    }
  },
  runTask(name) {
    return schtasks(['/Run', '/TN', name]).code === 0;
  },
  deleteTask(name) {
    const { code, output } = schtasks(['/Delete', '/TN', name, '/F']);
    if (code !== 0) {
      throw new HostError(
        t('schtasks did not remove the task {name} (exit code {code}): {output}', {
          name,
          code,
          output,
        }),
        'schtasks',
      );
    }
  },
};
