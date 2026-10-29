// The example page: what the shim and the bridge say, and a view module whose
// edits Vite swaps in place (hot module replacement) -- in the game, through
// the page the client loads from this dev server.
import { render } from './view.js';

const root = document.getElementById('app');
const state = {
  shimFirst: Boolean(window.__varionPageShim && window.__varionPageShim.first),
  bridge: Boolean(window.varion && typeof window.varion.emit === 'function'),
  pings: 0,
};

let draw = render;
const update = () => draw(root, state);
update();

if (state.bridge && typeof window.varion.on === 'function') {
  // A client script answers the page through view.emit('example:ping').
  window.varion.on('example:ping', () => {
    state.pings += 1;
    update();
  });
  window.varion.emit('example:ready');
}

if (import.meta.hot) {
  import.meta.hot.accept('./view.js', (next) => {
    if (!next) return;
    draw = next.render;
    update();
  });
}
