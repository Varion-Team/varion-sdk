import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import { canonicalJson } from '../../../src/host/request.mjs';
import { makeRequest, signRequest } from './fixtures.mjs';

const PHASES = new Set([
  'downloading',
  'verifying',
  'activating',
  'active',
  'failed',
  'rolled-back',
]);
const FINAL = ['active', 'failed', 'rolled-back'];
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const hex = (bytes) => crypto.randomBytes(bytes).toString('hex');
const newCode = () =>
  [0, 1, 2, 3, 4, 5]
    .map(
      (index) => `${index === 3 ? '-' : ''}${CODE_LETTERS[crypto.randomInt(CODE_LETTERS.length)]}`,
    )
    .join('');
const fingerprint = (publicKey) =>
  `sha256:${crypto.createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest('hex').slice(0, 16)}`;

function verifies({ request, signature, publicKey }) {
  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'),
        Buffer.from(publicKey, 'base64'),
      ]),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(
      null,
      Buffer.from(canonicalJson(request)),
      key,
      Buffer.from(signature, 'base64'),
    );
  } catch {
    return false;
  }
}

export async function startFakeCabinet({
  token,
  developer,
  serverId = 'srv-test',
  serverName = 'Test server',
  port = 0,
  pollAfterMs = 200,
  pairExpiresIn = 600,
} = {}) {
  const releases = new Map();
  const files = new Map();
  const pending = [];
  const known = new Set();
  const statuses = new Map();
  const polls = [];
  const waiters = new Set();
  const hostTokens = new Set(token ? [token] : []);
  const pairs = new Map();
  const logins = new Map();
  const accounts = new Map();
  const developerTokens = new Set();
  const developerKeys = [];
  const panelReleases = [];
  const panelDeploys = new Map();
  const held = new Set();
  let pollWaiter = null;

  const notify = () => {
    for (const waiter of [...waiters]) waiter();
  };
  const bearer = (req) => /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1] || '';
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  const readJson = async (req) => JSON.parse((await readBody(req)).toString('utf8') || '{}');
  const json = (res, status, value) => {
    const body = Buffer.from(JSON.stringify(value));
    res.writeHead(status, { 'content-type': 'application/json', 'content-length': body.length });
    res.end(body);
  };
  const hostView = (item) => {
    const zip = item.request ? releases.get(item.request.releaseId) : null;
    return {
      ...item,
      release: zip
        ? {
            releaseId: item.request.releaseId,
            sha256: crypto.createHash('sha256').update(zip).digest('hex'),
            size: zip.length,
            url: `/api/servers/agent/releases/${item.request.releaseId}`,
          }
        : null,
      preview: item.request?.env?.startsWith('preview-')
        ? { env: item.request.env, expiresAt: Date.now() + 7 * 86_400_000 }
        : null,
    };
  };
  const deployView = (deploy) => ({
    deployId: deploy.deployId,
    serverId: deploy.signed.request.serverId,
    status: deploy.status,
    action: deploy.signed.request.action,
    env: deploy.signed.request.env,
    project: deploy.signed.request.project,
    releaseId: deploy.signed.request.releaseId,
    sha256: deploy.signed.request.sha256,
    nonce: deploy.signed.request.nonce,
    error: deploy.error || '',
    link: '',
    hostOnline: true,
  });

  async function agent(req, res, url) {
    if (!hostTokens.has(bearer(req))) return json(res, 401, { error: 'Invalid token' });
    if (req.method === 'POST' && url.pathname === '/api/servers/agent/deploy/poll') {
      const body = await readJson(req);
      polls.push({ at: Date.now(), body, token: bearer(req) });
      const answer = () =>
        json(res, 200, {
          serverId,
          deploys: pending.splice(0, pending.length).map(hostView),
          previews: [],
          pollAfterMs,
        });
      const wait = Number.isInteger(body.wait) ? Math.min(Math.max(body.wait, 0), 25) : 0;
      if (pending.length || !wait) return answer();
      const release = () => {
        clearTimeout(timer);
        held.delete(release);
        if (pollWaiter === release) pollWaiter = null;
        if (!res.writableEnded) answer();
      };
      const timer = setTimeout(release, wait * 1000);
      held.add(release);
      pollWaiter = release;
      return undefined;
    }
    if (req.method === 'POST' && url.pathname === '/api/servers/agent/deploy/status') {
      const body = await readJson(req);
      if (!known.has(body.deployId))
        return json(res, 404, {
          error: 'No such deploy for this server',
          code: 'deploy_not_found',
        });
      if (!PHASES.has(body.phase)) return json(res, 400, { error: 'phase', code: 'bad_phase' });
      if (!statuses.has(body.deployId)) statuses.set(body.deployId, []);
      statuses.get(body.deployId).push({ ...body, at: Date.now() });
      const deploy = panelDeploys.get(body.deployId);
      if (deploy) Object.assign(deploy, { status: body.phase, error: body.error || '' });
      notify();
      return json(res, 200, { ok: true, status: body.phase });
    }
    if (req.method === 'GET' && url.pathname === '/api/servers/agent/keys') {
      if (cabinet.keysAnswer === 'missing') return json(res, 404, { error: 'not found' });
      if (cabinet.keysAnswer === 'failing') return json(res, 500, { error: 'database is down' });
      cabinet.keyRequests++;
      const approved = developerKeys.filter((key) => key.status === 'approved');
      return json(res, 200, {
        keys: approved.map(({ publicKey, name, accountId, rights }) => ({
          publicKey,
          name,
          accountId,
          fingerprint: fingerprint(publicKey),
          ...rights,
        })),
      });
    }
    const match = /^\/api\/servers\/agent\/releases\/([^/]+)$/.exec(url.pathname);
    if (req.method === 'GET' && match) {
      const zip = releases.get(decodeURIComponent(match[1]));
      if (!zip)
        return json(res, 404, {
          error: 'No such release on this server',
          code: 'release_not_found',
        });
      res.writeHead(200, { 'content-type': 'application/zip', 'content-length': zip.length });
      return res.end(zip);
    }
    return json(res, 404, { error: 'not found' });
  }

  async function pairing(req, res, url) {
    if (!cabinet.pairing) return json(res, 404, { error: 'not found' });
    const body = await readJson(req);
    if (url.pathname === '/api/host/pair/start') {
      const pair = {
        pairId: crypto.randomUUID(),
        code: newCode(),
        pollSecret: hex(16),
        hostId: body.hostId,
        hostname: body.hostname,
        status: 'pending',
      };
      pairs.set(pair.pairId, pair);
      cabinet.pairStarts.push(pair);
      setImmediate(() => cabinet.onPairStart?.(pair));
      const { pairId, code, pollSecret } = pair;
      return json(res, 200, { pairId, code, pollSecret, expiresIn: pairExpiresIn, interval: 1 });
    }
    const pair = pairs.get(body.pairId);
    if (!pair || pair.pollSecret !== body.pollSecret) {
      return json(res, 404, { error: 'No such pairing', code: 'pair_not_found' });
    }
    if (pair.status === 'paired') {
      pairs.delete(pair.pairId);
      return json(res, 200, {
        status: 'paired',
        serverId,
        serverName,
        token: pair.token,
      });
    }
    if (pair.status === 'expired') pairs.delete(pair.pairId);
    return json(res, 200, { status: pair.status });
  }

  async function signIn(req, res, url) {
    const body = await readJson(req);
    if (url.pathname === '/api/cli/login/start') {
      const login = {
        deviceId: crypto.randomUUID(),
        userCode: newCode(),
        pollSecret: hex(16),
        name: body.name,
        status: 'pending',
      };
      logins.set(login.deviceId, login);
      setImmediate(() => cabinet.onLoginStart?.(login));
      const { deviceId, userCode, pollSecret } = login;
      return json(res, 200, {
        deviceId,
        userCode,
        verifyUrl: `${cabinet.url}/cabinet/device?code=${userCode}`,
        pollSecret,
        expiresIn: 600,
        interval: 1,
      });
    }
    const login = logins.get(body.deviceId);
    if (!login || login.pollSecret !== body.pollSecret) {
      return json(res, 404, { error: 'Нет такого входа', code: 'device_not_found' });
    }
    if (login.status !== 'approved') return json(res, 200, { status: login.status });
    logins.delete(login.deviceId);
    return json(res, 200, { status: 'approved', token: login.token, account: login.account });
  }

  async function account(req, res, url) {
    const who = accounts.get(bearer(req));
    if (!who) return json(res, 401, { error: 'Вход больше не действует', code: 'token_invalid' });
    if (req.method === 'GET' && url.pathname === '/api/cli/me') {
      return json(res, 200, { account: who, servers: cabinet.servers });
    }
    if (req.method === 'POST' && url.pathname === '/api/cli/keys') {
      const body = await readJson(req);
      if (Buffer.from(String(body.publicKey), 'base64').length !== 32) {
        return json(res, 400, { error: 'Это не ключ Ed25519', code: 'bad_key' });
      }
      const key = {
        id: crypto.randomUUID(),
        accountId: who.id,
        name: body.name,
        publicKey: body.publicKey,
        status: 'pending',
      };
      developerKeys.push(key);
      return json(res, 201, { key: { id: key.id, fingerprint: fingerprint(key.publicKey) } });
    }
    return json(res, 404, { error: 'not found' });
  }

  async function panel(req, res, url) {
    const caller = bearer(req);
    if (!accounts.has(caller) && !developerTokens.has(caller)) {
      return json(res, 401, { error: 'Нужен ключ разработчика', code: 'token_required' });
    }
    cabinet.panelTokens.push(caller);
    const [, id, part, deployId] =
      /^\/api\/panel\/servers\/([^/]+)\/(releases|deploys)(?:\/([^/]+))?$/.exec(url.pathname) || [];
    if (req.method === 'GET' && part === 'releases') {
      return json(res, 200, {
        serverId: id,
        releases: panelReleases.filter((release) => release.serverId === id),
        limits: { maxBundleBytes: 100 << 20, keepReleases: 5 },
      });
    }
    if (req.method === 'POST' && part === 'deploys' && !deployId) {
      const signed = await readJson(req);
      if (!verifies(signed))
        return json(res, 400, { error: 'Подпись не сходится', code: 'bad_sig' });
      const deploy = { deployId: crypto.randomUUID(), signed, status: 'queued', serverId: id };
      panelDeploys.set(deploy.deployId, deploy);
      known.add(deploy.deployId);
      if (cabinet.onPanelDeploy) cabinet.onPanelDeploy(deploy);
      else {
        pending.push({ deployId: deploy.deployId, ...signed });
        if (pollWaiter) pollWaiter();
      }
      return json(res, 202, { deployId: deploy.deployId, status: deploy.status });
    }
    if (req.method === 'GET' && part === 'deploys' && deployId) {
      const deploy = panelDeploys.get(deployId);
      if (!deploy) return json(res, 404, { error: 'Такой выкладки нет', code: 'deploy_not_found' });
      return json(res, 200, deployView(deploy));
    }
    return json(res, 404, { error: 'not found' });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname.startsWith('/api/servers/agent/')) return await agent(req, res, url);
      if (req.method === 'POST' && url.pathname.startsWith('/api/host/pair/'))
        return await pairing(req, res, url);
      if (req.method === 'POST' && url.pathname.startsWith('/api/cli/login/'))
        return await signIn(req, res, url);
      if (url.pathname.startsWith('/api/cli/')) return await account(req, res, url);
      if (url.pathname.startsWith('/api/panel/servers/')) return await panel(req, res, url);
      const file = files.get(url.pathname);
      if (req.method === 'GET' && file) {
        if (Buffer.isBuffer(file)) {
          res.writeHead(200, { 'content-length': file.length });
          return res.end(file);
        }
        res.writeHead(200, { 'content-length': fs.statSync(file.path).size });
        return fs.createReadStream(file.path).pipe(res);
      }
      return json(res, 404, { error: 'not found' });
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;

  const cabinet = {
    url,
    serverId,
    releases,
    files,
    statuses,
    polls,
    pending,
    pairing: true,
    pairStarts: [],
    keysAnswer: 'keys',
    keyRequests: 0,
    developerKeys,
    servers: [{ id: serverId, name: serverName, deployTest: true, deployProd: false }],
    panelReleases,
    panelDeploys,
    panelTokens: [],
    onPairStart: null,
    onLoginStart: null,
    onPanelDeploy: null,
    addRelease(releaseId, zip) {
      releases.set(releaseId, zip);
    },
    serve(pathname, content) {
      files.set(pathname, content);
    },
    queue(item) {
      known.add(item.deployId);
      pending.push(item);
      if (pollWaiter) pollWaiter();
    },
    deploy(fields, { keys = developer, deployId = crypto.randomUUID(), tamper } = {}) {
      const request = makeRequest(fields);
      const signed = signRequest(request, keys);
      if (tamper) tamper(signed);
      cabinet.queue({ deployId, ...signed });
      return deployId;
    },
    phases(deployId) {
      return (statuses.get(deployId) || []).map((status) => status.phase);
    },
    last(deployId) {
      const list = statuses.get(deployId) || [];
      return list[list.length - 1] || null;
    },
    waitFinal(deployId, timeoutMs = 60_000) {
      return new Promise((resolve, reject) => {
        const check = () => {
          const last = cabinet.last(deployId);
          if (last && FINAL.includes(last.phase)) {
            waiters.delete(check);
            clearTimeout(timer);
            resolve(last);
            return true;
          }
          return false;
        };
        const timer = setTimeout(() => {
          waiters.delete(check);
          reject(
            new Error(
              `no final status for ${deployId} in ${timeoutMs} ms (have: ${cabinet.phases(deployId).join(', ') || 'none'})`,
            ),
          );
        }, timeoutMs);
        if (!check()) waiters.add(check);
      });
    },
    // the owner enters the code on the page of the server
    pair(code) {
      const pair = [...pairs.values()].find((item) => item.code === code);
      if (!pair || pair.status !== 'pending') throw new Error(`no pending pair ${code}`);
      pair.token = `varion_srv_${hex(32)}`;
      pair.status = 'paired';
      hostTokens.add(pair.token);
      return pair.token;
    },
    expirePair(code) {
      const pair = [...pairs.values()].find((item) => item.code === code);
      if (pair) pair.status = 'expired';
    },
    revokeHostToken(value) {
      hostTokens.delete(value);
      for (const release of [...held]) release();
    },
    approveLogin(userCode, who = { id: 'acc-1', name: 'Dev' }) {
      const login = [...logins.values()].find((item) => item.userCode === userCode);
      if (!login) throw new Error(`no sign-in ${userCode}`);
      login.token = `varion_cli_${hex(32)}`;
      login.account = who;
      login.status = 'approved';
      accounts.set(login.token, who);
      return login.token;
    },
    denyLogin(userCode) {
      const login = [...logins.values()].find((item) => item.userCode === userCode);
      if (login) login.status = 'denied';
    },
    signedIn(value, who = { id: 'acc-1', name: 'Dev' }) {
      accounts.set(value, who);
    },
    revokeCliToken(value) {
      accounts.delete(value);
    },
    developerToken(value) {
      developerTokens.add(value);
    },
    approveKey(publicKey, { name = 'developer', accountId = 'acc-1', rights } = {}) {
      const key = developerKeys.find((item) => item.publicKey === publicKey);
      if (key) Object.assign(key, { status: 'approved', rights });
      else
        developerKeys.push({
          id: crypto.randomUUID(),
          accountId,
          name,
          publicKey,
          status: 'approved',
          rights,
        });
    },
    revokeKey(publicKey) {
      for (const key of developerKeys) if (key.publicKey === publicKey) key.status = 'revoked';
    },
    finishDeploy(deployId, status, error = '') {
      Object.assign(panelDeploys.get(deployId), { status, error });
    },
    close() {
      for (const release of [...held]) release();
      return new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve());
      });
    },
  };
  return cabinet;
}
