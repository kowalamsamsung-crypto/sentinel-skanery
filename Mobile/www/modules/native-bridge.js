/*
 * SENTINEL - most do natywnych wtyczek Capacitor (skanery, aparat).
 * Działa w głównej stronie i w iframe'ach modułów (DDMS, W/H, Cleanily):
 * szuka obiektu Capacitor w bieżącym oknie, w rodzicu i w top.
 *
 * Wtyczki lokalne (napisane w Javie w projekcie APK, np. SentinelScanner)
 * nie zawsze trafiają do Capacitor.Plugins - dlatego są rejestrowane
 * ręcznie przez registerPlugin(). Wtyczki z npm (Camera) są w Plugins.
 */
(function (global) {
  'use strict';

  const LOCAL_PLUGINS = ['SentinelScanner'];
  const cache = {};

  function hosts() {
    const list = [];
    const add = h => { if (h && list.indexOf(h) === -1) list.push(h); };
    try { add(global.Capacitor); } catch (_) {}
    try { if (global.parent && global.parent !== global) add(global.parent.Capacitor); } catch (_) {}
    try { if (global.top && global.top !== global) add(global.top.Capacitor); } catch (_) {}
    return list;
  }

  function hostIsNative(h) {
    try {
      if (typeof h.isNativePlatform === 'function') return !!h.isNativePlatform();
      if (typeof h.getPlatform === 'function') return h.getPlatform() !== 'web';
    } catch (_) {}
    return false;
  }

  function isNative() {
    return hosts().some(hostIsNative);
  }

  function plugin(name) {
    if (cache[name]) return cache[name];
    for (const h of hosts()) {
      if (!hostIsNative(h)) continue;
      try {
        let p = h.Plugins && h.Plugins[name];
        if (!p && LOCAL_PLUGINS.indexOf(name) !== -1 && typeof h.registerPlugin === 'function') {
          p = h.registerPlugin(name);
        }
        if (p) { cache[name] = p; return p; }
      } catch (_) {}
    }
    return null;
  }

  function fileSrc(path) {
    for (const h of hosts()) {
      try {
        if (typeof h.convertFileSrc === 'function') return h.convertFileSrc(path);
      } catch (_) {}
    }
    return path;
  }

  global.SentinelNative = { isNative: isNative, plugin: plugin, fileSrc: fileSrc };
})(window);
