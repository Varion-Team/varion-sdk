import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { writeJsonAtomic } from '../shared/fs.mjs';
import { commandLineOf } from '../shared/process.mjs';

export async function leftoverProcess(pidFile, marker) {
  let record;
  try {
    record = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
  } catch {
    return null;
  }
  const pid = Number(record?.pid);
  // the pid may name another process by now: its command line has to name the marker
  const commandLine = await commandLineOf(pid);
  if (commandLine && commandLine.toLowerCase().includes(String(marker).toLowerCase())) return pid;
  fs.rmSync(pidFile, { force: true });
  return null;
}

export function writePidFile(pidFile, data) {
  writeJsonAtomic(pidFile, { ...data, startedAt: new Date().toISOString() });
}

export function shellQuote(value) {
  const text = String(value);
  if (process.platform === 'win32')
    return /[\s"&|<>^%!()]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  return /^[A-Za-z0-9_./:=@+-]+$/.test(text) ? text : `'${text.replace(/'/g, `'\\''`)}'`;
}

export function runShell(commandLine, { cwd, env, vars = {}, capture = false, onLine } = {}) {
  const line = commandLine.replace(/\{([a-zA-Z]+)\}/g, (whole, name) =>
    name in vars ? shellQuote(vars[name]) : whole,
  );
  return new Promise((resolve) => {
    const child = spawn(line, {
      cwd,
      env,
      shell: true,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const take = (stream, target) => {
      let rest = '';
      stream.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        output += text;
        if (output.length > 1 << 20) output = output.slice(-(1 << 19));
        if (!capture) target.write(chunk);
        if (onLine) {
          const lines = (rest + text).split(/\r?\n/);
          rest = lines.pop();
          for (const item of lines) onLine(item);
        }
      });
    };
    take(child.stdout, process.stdout);
    take(child.stderr, process.stderr);
    child.on('error', (error) =>
      resolve({ code: -1, output: `${output}${error.message}\n`, line }),
    );
    child.on('close', (code) => resolve({ code: code ?? -1, output, line }));
  });
}

export function runProgram(file, args, { cwd, env, input, timeout } = {}) {
  const result = spawnSync(file, args, {
    cwd,
    env,
    input,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 << 20,
    timeout,
  });
  return {
    code: result.status ?? -1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
  };
}

export function runProgramAsync(file, args, { cwd, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(file, args, {
      cwd,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString('utf8')));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString('utf8')));
    child.on('error', (error) =>
      resolve({ code: -1, stdout, stderr: `${stderr}${error.message}` }),
    );
    child.on('close', (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}
