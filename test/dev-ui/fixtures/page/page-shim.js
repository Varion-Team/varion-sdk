// The example mode's page shim -- what a mode's build puts first into its page
// (varion-rp's is RAGE's `mp` over window.varion). In the game the client has
// put window.varion (emit, trigger) on the page before any script runs; this
// adds varion.on/off over the bridge's trigger. Outside the game there is no
// bridge, and the page says so.
(function () {
  'use strict';
  var current = document.currentScript;
  var scripts = document.getElementsByTagName('script');
  window.__varionPageShim = { first: scripts.length > 0 && scripts[0] === current };

  var bridge = window.varion;
  if (!bridge || typeof bridge.emit !== 'function') return;
  var handlers = {};
  bridge.on = function (name, fn) {
    (handlers[name] || (handlers[name] = [])).push(fn);
  };
  bridge.off = function (name, fn) {
    handlers[name] = (handlers[name] || []).filter(function (other) {
      return other !== fn;
    });
  };
  // The client calls window.varion.trigger(name, ...args) for each event to the page.
  bridge.trigger = function (name) {
    var args = Array.prototype.slice.call(arguments, 1);
    (handlers[name] || []).slice().forEach(function (fn) {
      try {
        fn.apply(null, args);
      } catch (error) {
        console.error('[page] ' + name, error);
      }
    });
  };
})();
