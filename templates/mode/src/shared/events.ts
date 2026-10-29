// Every event of the mode and its payload (sent as JSON). The net.ts helpers accept only these,
// so a typo fails type checking on every side.

export interface Welcome {
  title: string;
  greeting: string;
  name: string;
  online: number;
  clicks: number;
}

export interface UiState extends Welcome {
  cursor: boolean;
}

// server -> client
export type ServerToClient = {
  '__NAME__:welcome': [welcome: Welcome];
  '__NAME__:online': [online: number];
  '__NAME__:pong': [sentAt: number, serverTime: number];
};

// client -> server
export type ClientToServer = {
  '__NAME__:hello': [];
  '__NAME__:ping': [sentAt: number];
};

// client -> server, with an answer
export type ServerRpc = {
  '__NAME__:click': { args: []; result: { clicks: number } };
  '__NAME__:status': { args: []; result: { playerId: number; online: number; uptimeSec: number } };
};

// client script -> page
export type ClientToUi = {
  'ui:state': [state: UiState];
};

// page -> client script
export type UiToClient = {
  'ui:ready': [];
  'ui:click': [];
};
