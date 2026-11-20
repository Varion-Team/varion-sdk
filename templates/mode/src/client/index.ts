import { hideHudComponentThisFrame, mpTextChatDisable } from '@varion/natives';
import { callServer, emitServer, onServer, page, type Page } from './net';
import type { ChatLine, UiState } from '../shared/events';

const RESOURCE: string = varion.resourceName;
const T = 84;
const LINES_KEPT = 30;
// GTA's own pieces of the top right corner, where the mode's sign stands:
// wanted stars, weapon icon, cash, multiplayer cash, cash change
const GTA_HUD_HIDDEN = [1, 2, 3, 4, 13];

let ui: Page | null = null;
let state: UiState = { lines: [], typing: false };

const render = () => ui?.emit('ui:state', state);

// The page takes the keyboard while the line is open, and GTA's controls are off for that time.
function setTyping(on: boolean): void {
  if (!ui || state.typing === on) return;
  state = { ...state, typing: on };
  if (on) ui.view.focus();
  else ui.view.unfocus();
  render();
}

function addLine(line: ChatLine): void {
  state = { ...state, lines: [...state.lines, line].slice(-LINES_KEPT) };
  render();
}

// The server answers whether the message went to the chat; it comes back with everyone's.
async function say(text: string): Promise<void> {
  try {
    const { sent } = await callServer('__NAME__:say', text);
    if (!sent)
      addLine({ at: Date.now(), from: '', text: 'Not so fast: the message was not sent.' });
  } catch (error) {
    varion.logError(`[${RESOURCE}] the message was not sent: ${String(error)}`);
  }
}

varion.on(varion.Event.resourceStart, () => {
  // GTA has a text chat of its own on the same key: the mode shows its own instead
  mpTextChatDisable(true);
  // covers the screen and draws at its edges; hidden until the welcome arrives
  ui = page(
    varion.WebView.create({
      url: varion.assetUrl(RESOURCE, 'ui/index.html'),
      visible: false,
    }),
  );
  ui.on('ui:ready', render);
  ui.on('ui:send', (text) => {
    setTyping(false);
    void say(text);
  });
  ui.on('ui:close', () => setTyping(false));
  // after a restart on the fly the server sends the welcome again
  emitServer('__NAME__:hello');
});

onServer('__NAME__:welcome', () => {
  if (ui) ui.view.visible = true;
  render();
});

onServer('__NAME__:chat', addLine);

// GTA draws them again every frame, so they are hidden every frame
varion.everyTick(() => {
  for (const piece of GTA_HUD_HIDDEN) hideHudComponentThisFrame(piece);
});

// on the key's release: the letter that opens the line is not typed into it
varion.on(varion.Event.keyup, (key) => {
  if (key === T) setTyping(true);
});

varion.on(varion.Event.resourceStop, () => {
  ui?.view.destroy();
  ui = null;
});
