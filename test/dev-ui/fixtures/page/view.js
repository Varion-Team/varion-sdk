// Edit this file while the page is open: the dev server sends the new module
// and main.js draws with it, the page and its state kept.
export const HEADLINE = 'Varion dev UI';

export function render(root, state) {
  const line = (label, ok) =>
    `<li class="${ok ? 'ok' : 'off'}">${label}: ${ok ? 'yes' : 'no'}</li>`;
  root.innerHTML =
    `<h1>${HEADLINE}</h1>` +
    '<ul>' +
    line('page shim ran first', state.shimFirst) +
    line('game bridge (window.varion)', state.bridge) +
    `<li>pings from the client script: ${state.pings}</li>` +
    '</ul>';
}
