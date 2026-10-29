import { execFile, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// by full path: Git for Windows puts its own whoami and friends first in PATH
export function windowsTool(name, env = process.env) {
  return path.join(env.SystemRoot || env.windir || 'C:\\Windows', 'System32', name);
}

export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

export function killTree(pid) {
  if (!isAlive(pid)) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {}
  }
}

function powershell(command, timeoutMs = 20_000) {
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 1 << 20 },
      (error, stdout) => resolve(error ? null : String(stdout)),
    );
  });
}

export async function commandLineOf(pid) {
  if (!isAlive(pid)) return null;
  if (process.platform === 'win32') {
    const out = await powershell(
      `(Get-CimInstance Win32_Process -Filter "ProcessId=${Number(pid)}").CommandLine`,
    );
    return out?.trim() || null;
  }
  try {
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').join(' ').trim() || null;
  } catch {
    return null;
  }
}

export async function childPids(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return [];
  if (process.platform === 'win32') {
    const out = await powershell(
      `Get-CimInstance Win32_Process -Filter "ParentProcessId=${pid}" | ForEach-Object { $_.ProcessId }`,
    );
    return (out || '')
      .split(/\s+/)
      .filter((item) => /^\d+$/.test(item))
      .map(Number);
  }
  if (process.platform === 'linux') {
    const children = [];
    for (const name of fs.readdirSync('/proc').filter((entry) => /^\d+$/.test(entry))) {
      try {
        const stat = fs.readFileSync(`/proc/${name}/stat`, 'utf8');
        const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
        if (Number(fields[1]) === pid) children.push(Number(name));
      } catch {}
    }
    return children;
  }
  return [];
}
