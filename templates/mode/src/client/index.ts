import { callServer, emitServer, onServer, page, type Page } from './net';
import type { UiState } from '../shared/events';

const RESOURCE: string = varion.resourceName;
const F2 = 113;

let ui: Page | null = null;
let state: UiState = { title: '', greeting: '', name: '', online: 0, clicks: 0, cursor: false };

const render = () => ui?.emit('ui:state', state);

function setCursor(on: boolean): void {
  state = { ...state, cursor: on };
  varion.showCursor(on);
  varion.toggleGameControls(!on);
  render();
}

varion.on('resourceStart', () => {
  // hidden until the welcome arrives
  ui = page(
    varion.WebView.create({
      url: varion.assetUrl(RESOURCE, 'ui/index.html'),
      pos: { x: 0, y: 0 },
      size: { x: 1, y: 1 },
      visible: false,
    }),
  );
  ui.on('ui:ready', render);
  ui.on('ui:click', async () => {
    try {
      const { clicks } = await callServer('__NAME__:click');
      state = { ...state, clicks };
      render();
    } catch (error) {
      varion.logError(`[${RESOURCE}] click failed: ${String(error)}`);
    }
  });
  // after a restart on the fly the server sends the welcome again
  emitServer('__NAME__:hello');
  emitServer('__NAME__:ping', Date.now());
});

onServer('__NAME__:welcome', (welcome) => {
  state = { ...state, ...welcome };
  if (ui) ui.view.visible = true;
  render();
});

onServer('__NAME__:online', (online) => {
  state = { ...state, online };
  render();
});

onServer('__NAME__:pong', (sentAt, serverTime) => {
  varion.log(
    `[${RESOURCE}] round trip ${Date.now() - sentAt} ms (server time ${new Date(serverTime).toISOString()})`,
  );
});

varion.on('keydown', (key) => {
  if (key === F2) setCursor(!state.cursor);
});

varion.on('resourceStop', () => {
  if (state.cursor) {
    varion.showCursor(false);
    varion.toggleGameControls(true);
  }
  ui?.view.destroy();
  ui = null;
});
