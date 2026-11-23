// What this host knows about its deploys: how far each one got, and the statuses the cabinet
// has not received yet.
import fs from 'node:fs';
import path from 'node:path';
import { t } from '../i18n/index.mjs';
import { FINAL } from '../shared/deploy-format.mjs';
import { errorMessage } from '../shared/errors.mjs';
import { readJson, writeJsonAtomic } from '../shared/fs.mjs';
import { isPermanentRefusal } from './cabinet.mjs';
import { safeInstanceName } from './paths.mjs';

const RECORDS_KEPT = 500;
const UNSENT_KEPT = 200;

export class DeployJournal {
  // `reportStatus(status)` sends one status to the cabinet and rejects when it does not arrive.
  constructor({ layout, log, reportStatus }) {
    this.layout = layout;
    this.log = log;
    this.reportStatus = reportStatus;
    this.records = readJson(layout.deploys, { format: 1, deploys: {} });
    this.unsent = readJson(layout.outbox, { format: 1, statuses: [] });
    // the deploy the host is carrying out right now, if any
    this.current = null;
    this.sending = null;
  }

  get(deployId) {
    return deployId ? this.records.deploys[deployId] || null : null;
  }

  get unsentCount() {
    return this.unsent.statuses.length;
  }

  record(deployId, fields) {
    if (!deployId) return;
    const { deploys } = this.records;
    deploys[deployId] = { ...(deploys[deployId] || {}), ...fields, at: new Date().toISOString() };
    const ids = Object.keys(deploys);
    for (const id of ids.slice(0, Math.max(0, ids.length - RECORDS_KEPT))) delete deploys[id];
    writeJsonAtomic(this.layout.deploys, this.records);
  }

  // A request was accepted: the host works on this deploy until `end`.
  begin(deployId, request, signature) {
    const { nonce, action, releaseId, project, env, serverId } = request;
    this.record(deployId, {
      phase: 'accepted',
      signature,
      nonce,
      action,
      releaseId,
      project,
      env,
      serverId,
    });
    this.current = { deployId, action, releaseId, since: new Date().toISOString() };
  }

  end() {
    this.current = null;
  }

  // A deploy moved on to its next phase.
  async progress(deployId, phase, { port } = {}) {
    if (!deployId) return;
    this.record(deployId, { phase });
    await this.report(deployId, phase, { port });
  }

  // A deploy ended. Its last status is kept until the cabinet has it.
  async finish(deployId, phase, { error, port, signature }) {
    this.record(deployId, {
      phase,
      error: error || undefined,
      port: port ?? undefined,
      ...(signature ? { signature } : {}),
    });
    await this.report(deployId, phase, { error, port, final: true });
  }

  // Says again how a deploy stands: for a request the cabinet handed over a second time.
  again(deployId) {
    const known = this.get(deployId);
    return this.report(deployId, known.phase, {
      error: known.error,
      port: known.port,
      final: FINAL.has(known.phase),
    });
  }

  async report(deployId, phase, { error, port, final = false } = {}) {
    const status = {
      deployId,
      phase,
      ...(error ? { error } : {}),
      ...(Number.isInteger(port) ? { port } : {}),
    };
    let line = t('status {deployId}: {phase}', { deployId, phase });
    if (error) line += ` - ${error}`;
    if (Number.isInteger(port)) line += ` (${t('port {port}', { port })})`;
    this.log.info(line, { ...status }, 'status');
    try {
      await this.reportStatus(status);
    } catch (problem) {
      // a status in between is soon followed by the next one
      if (final) this.keepUnsent(status, problem);
    }
  }

  keepUnsent(status, problem) {
    const { deployId } = status;
    if (isPermanentRefusal(problem)) {
      this.log.warn(
        t('the cabinet refused the status of {deployId} ({error})', {
          deployId,
          error: errorMessage(problem),
        }),
        { deployId },
        'status-refused',
      );
      return;
    }
    this.unsent.statuses = this.unsent.statuses
      .filter((item) => item.deployId !== deployId)
      .concat([status])
      .slice(-UNSENT_KEPT);
    writeJsonAtomic(this.layout.outbox, this.unsent);
    this.log.warn(
      t('the status of {deployId} did not reach the cabinet ({error}); will send it later', {
        deployId,
        error: errorMessage(problem),
      }),
      { deployId },
      'status-queued',
    );
  }

  // The timer and the poll loop both come here: they share one round.
  sendUnsent() {
    this.sending ??= this.sendRound().finally(() => {
      this.sending = null;
    });
    return this.sending;
  }

  async sendRound() {
    const settled = new Set();
    for (const status of [...this.unsent.statuses]) {
      try {
        await this.reportStatus(status);
        settled.add(status);
      } catch (problem) {
        if (isPermanentRefusal(problem)) settled.add(status);
      }
    }
    if (!settled.size) return;
    // a status queued while this round was waiting for the cabinet stays
    this.unsent.statuses = this.unsent.statuses.filter((status) => !settled.has(status));
    writeJsonAtomic(this.layout.outbox, this.unsent);
  }

  // The deploys an earlier run of the host did not finish: they failed with that run.
  closeInterrupted() {
    for (const [deployId, record] of Object.entries(this.records.deploys)) {
      if (FINAL.has(record.phase)) continue;
      const name = safeInstanceName(record);
      const currentFile = path.join(this.layout.instancesDir, name, 'current');
      const current =
        name && fs.existsSync(currentFile) ? fs.readFileSync(currentFile, 'utf8').trim() : '';
      const error = current
        ? t('the host restarted during the deploy (phase {phase}); {releaseId} is active', {
            phase: record.phase,
            releaseId: current,
          })
        : t('the host restarted during the deploy (phase {phase})', { phase: record.phase });
      Object.assign(record, { phase: 'failed', error, at: new Date().toISOString() });
      this.unsent.statuses = this.unsent.statuses
        .filter((item) => item.deployId !== deployId)
        .concat([{ deployId, phase: 'failed', error }]);
      this.log.warn(
        t('deploy {deployId}: {error}', { deployId, error }),
        { deployId },
        'deploy-interrupted',
      );
    }
    writeJsonAtomic(this.layout.deploys, this.records);
    writeJsonAtomic(this.layout.outbox, this.unsent);
  }
}
