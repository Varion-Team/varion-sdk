import { emitClient, inGame, onClient, simulate } from './net';
import { CHAT_MAX_LENGTH, type ChatLine, type UiState } from '../shared/events';

const LINES_SHOWN = 7;

const element = (id: string) => document.getElementById(id) as HTMLElement;
const message = element('message') as HTMLInputElement;
const clock = (at: number) =>
  new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const keyOf = (line: ChatLine) => `${line.at}|${line.from}|${line.text}`;

function piece(tag: string, text: string): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function lineOf(line: ChatLine, isNew: boolean): HTMLElement {
  const item = document.createElement('li');
  item.append(piece('time', clock(line.at)));
  if (line.from) item.append(piece('b', `${line.from}:`));
  else item.classList.add('server');
  // a line that was not there at the last drawing comes in softly (style.css)
  if (isNew) item.classList.add('is-new');
  item.append(piece('span', line.text));
  return item;
}

let typing = false;
let lastShown: string | null = null;

function render(state: UiState): void {
  const hud = element('hud');
  hud.hidden = false;
  // the line to type in and the keys beside the screen's edge follow this class (style.css)
  hud.classList.toggle('is-typing', state.typing);

  // the lines go from the top down; when they do not fit, the oldest leave
  const shown = state.lines.slice(-LINES_SHOWN);
  const seen = lastShown === null ? shown.length : shown.map(keyOf).lastIndexOf(lastShown) + 1;
  const lines = element('lines');
  lines.replaceChildren(...shown.map((line, index) => lineOf(line, index >= seen)));
  while (lines.scrollHeight > lines.clientHeight && lines.childElementCount > 1) {
    lines.firstElementChild?.remove();
  }
  lastShown = shown.length ? keyOf(shown[shown.length - 1]) : '';

  if (state.typing !== typing) {
    typing = state.typing;
    message.value = '';
    if (typing) message.focus();
    else message.blur();
  }
}

message.maxLength = CHAT_MAX_LENGTH;
message.placeholder = 'Write a message...';

element('say').addEventListener('submit', (event) => {
  event.preventDefault();
  const text = message.value.trim();
  if (text) emitClient('ui:send', text);
  else emitClient('ui:close');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && typing) emitClient('ui:close');
});

onClient('ui:state', render);
emitClient('ui:ready');

if (!inGame) {
  // browser preview (npm run ui): fake what the client script and the server would do,
  // over a plain backdrop in place of the game
  document.body.style.background = '#3a4048';
  document.body.style.minHeight = '100vh';
  const now = Date.now();
  let preview: UiState = {
    lines: [{ at: now, from: '', text: 'Welcome, Player!' }],
    typing: false,
  };
  const show = (next: Partial<UiState>) =>
    simulate('ui:state', (preview = { ...preview, ...next }));
  show({});
  document.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 't' && !preview.typing) show({ typing: true });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') show({ typing: false });
  });
  element('say').addEventListener('submit', () => {
    const text = message.value.trim();
    const lines = text
      ? [...preview.lines, { at: Date.now(), from: 'Player', text }]
      : preview.lines;
    show({ lines, typing: false });
  });
}
