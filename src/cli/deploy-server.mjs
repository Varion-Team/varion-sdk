import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { getAccount } from '../deploy/client.mjs';
import { t } from '../i18n/index.mjs';
import { CONFIG_FILE } from './config.mjs';
import { CliError } from './output.mjs';

// The servers of the account this environment may be deployed to.
export function serversFor(servers, env) {
  const right = env === 'prod' ? 'deployProd' : 'deployTest';
  return servers.filter((server) => server.id && server[right]);
}

// varion.toml with `[deploy.<env>] server = "<id>"` in it: into the table when it is there,
// as a new table at the end when it is not. Nothing else in the file is touched.
export function withDeployServer(text, env, id) {
  const lines = String(text).split(/\r?\n/);
  const eol = /\r\n/.test(text) ? '\r\n' : '\n';
  const header = lines.findIndex((line) => line.trim() === `[deploy.${env}]`);
  const entry = `server = "${id}"`;
  if (header < 0) {
    const body = lines.join(eol).replace(/\s+$/, '');
    return `${body}${eol}${eol}[deploy.${env}]${eol}${entry}${eol}`;
  }
  let end = lines.findIndex((line, index) => index > header && /^\s*\[/.test(line));
  if (end < 0) end = lines.length;
  const own = lines.findIndex(
    (line, index) => index > header && index < end && /^\s*server\s*=/.test(line),
  );
  if (own >= 0) lines[own] = entry;
  else lines.splice(header + 1, 0, entry);
  return lines.join(eol);
}

function askWhich(servers, question) {
  return new Promise((resolve) => {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    prompt.question(question, (answer) => {
      prompt.close();
      const index = Number.parseInt(String(answer).trim(), 10);
      resolve(
        Number.isInteger(index) && index >= 1 && index <= servers.length
          ? servers[index - 1]
          : null,
      );
    });
  });
}

// `[deploy.<env>] server` is the one thing a deploy needs that the account already knows. With one
// server to choose from it is taken; with several a person is asked once. Either way it is written
// into varion.toml, so the next deploy and the rest of the team do not meet the question.
export async function findDeployServer({
  project,
  env,
  login,
  cabinetUrl,
  output,
  interactive,
  ask = askWhich,
  account = getAccount,
}) {
  const { servers } = await account({ cabinetUrl, token: login.token });
  const fit = serversFor(servers, env);
  if (!fit.length) {
    throw new CliError(
      servers.length
        ? t(
            'your account may not deploy {env} to any of its servers: ask the owner for the right in the cabinet',
            { env },
          )
        : t(
            'your account has no server yet: run varion host on the machine the server will run on and open the link it shows',
          ),
      { code: 'no_server' },
    );
  }
  let server = fit.length === 1 ? fit[0] : null;
  if (!server) {
    const list = fit.map((item, index) => `  ${index + 1}. ${item.name} (${item.id})`).join('\n');
    if (!interactive) {
      throw new CliError(
        `${t('[deploy.{env}] server is missing, and the account has several servers; put the id of one into varion.toml:', { env })}\n${list}`,
        { code: 'several_servers' },
      );
    }
    output.info(`${t('which server does {env} go to?', { env })}\n${list}`);
    server = await ask(fit, `${t('number')}: `);
    if (!server) throw new CliError(t('no server was chosen'), { code: 'no_server_chosen' });
  }
  const file = path.join(project.root, CONFIG_FILE);
  fs.writeFileSync(file, withDeployServer(fs.readFileSync(file, 'utf8'), env, server.id));
  output.info(
    t('{env} goes to the server {name}: written into varion.toml as [deploy.{env}] server', {
      env,
      name: server.name,
    }),
  );
  return server.id;
}
