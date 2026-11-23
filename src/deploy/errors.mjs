import { VarionError } from '../shared/errors.mjs';

export class DeployError extends VarionError {
  constructor(message, { code = 'deploy_failed', status = 0, data, cause } = {}) {
    super(message, { code, cause });
    this.status = status;
    this.exitCode = 1;
    if (data !== undefined) this.data = data;
  }
}
