// Every event of the mode and its payload (sent as JSON). The net.ts helpers accept only these,
// so a typo fails type checking on every side.

export const CHAT_MAX_LENGTH = 200;

export interface ChatLine {
  // when it was said, by the server's clock (Date.now())
  at: number;
  // who said it; empty when the server says it itself
  from: string;
  text: string;
}

export interface UiState {
  // the last lines of the chat, oldest first
  lines: ChatLine[];
  // the line to type a message in is open
  typing: boolean;
}

// server -> client
export type ServerToClient = {
  '__NAME__:welcome': [];
  '__NAME__:chat': [line: ChatLine];
};

// client -> server
export type ClientToServer = {
  '__NAME__:hello': [];
};

// client -> server, with an answer
export type ServerRpc = {
  // sent: false when the server did not pass the message on (empty, or too many in a second)
  '__NAME__:say': { args: [text: string]; result: { sent: boolean } };
};

// client script -> page
export type ClientToUi = {
  'ui:state': [state: UiState];
};

// page -> client script
export type UiToClient = {
  'ui:ready': [];
  'ui:send': [text: string];
  'ui:close': [];
};
