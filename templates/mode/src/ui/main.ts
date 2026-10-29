import { emitClient, inGame, onClient, simulate } from './net';
import type { UiState } from '../shared/events';

const element = (id: string) => document.getElementById(id) as HTMLElement;

function render(state: UiState): void {
  element('panel').hidden = false;
  element('title').textContent = state.title;
  element('greeting').textContent = `${state.greeting}, ${state.name}!`;
  element('online').textContent = String(state.online);
  element('clicks').textContent = String(state.clicks);
  element('hint').textContent = state.cursor
    ? 'F2 returns control to the game'
    : 'F2 shows the cursor';
  element('panel').classList.toggle('is-active', state.cursor);
}

onClient('ui:state', render);
element('click').addEventListener('click', () => emitClient('ui:click'));
emitClient('ui:ready');

if (!inGame) {
  // browser preview (npm run ui): fake what the client script would send
  let preview: UiState = {
    title: '__TITLE_TS__',
    greeting: 'Welcome',
    name: 'Player',
    online: 1,
    clicks: 0,
    cursor: true,
  };
  simulate('ui:state', preview);
  element('click').addEventListener('click', () => {
    preview = { ...preview, clicks: preview.clicks + 1 };
    simulate('ui:state', preview);
  });
}
