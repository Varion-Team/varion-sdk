import { VarionError } from '../shared/errors.mjs';

export class HostError extends VarionError {
  constructor(message, code = 'host-error') {
    super(message, { code });
  }
}

export class RequestRejected extends HostError {
  constructor(message, code = 'rejected') {
    super(message, code);
  }
}
