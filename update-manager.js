/* Tag Team Gauntlet Update Manager 1.0 */
(() => {
  'use strict';

  const LOCAL_VERSION = String(window.TTG_APP_VERSION || '0.0.0');
  const VERSION_URL = './version.json';
  const RELOAD_GUARD_KEY = 'ttg_update_reload_guard';

  function injectStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #ttg-update-status{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#080a10;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:24px}
      #ttg-update-status[hidden]{display:none}
      #ttg-update-status .update-card{width:min(420px,92vw);padding:28px;border:2px solid rgba(255,255,255,.18);border-radius:18px;background:#111521;box-shadow:0 24px 80px rgba(0,0,0,.55)}
      #ttg-update-status strong{display:block;font-size:1.35rem;letter-spacing:.06em;margin-bottom:10px}
      #ttg-update-status span{display:block;opacity:.75;line-height:1.5}
      #ttg-update-status .update-spinner{width:42px;height:42px;margin:0 auto 18px;border:4px solid rgba(255,255,255,.18);border-top-color:#fff;border-radius:50%;animation:ttg-spin .8s linear infinite}
      @keyframes ttg-spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
  }

  function showStatus(title, message) {
    let el = document.getElementById('ttg-update-status');
    if (!el) {
      injectStatusStyles();
      el = document.createElement('div');
      el.id = 'ttg-update-status';
      document.body.appendChild(el);
    }
    el.hidden = false;
    el.innerHTML = `<div class="update-card"><div class="update-spinner"></div><strong>${title}</strong><span>${message}</span></div>`;
  }

  async function fetchLatestVersion() {
    const response = await fetch(`${VERSION_URL}?check=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!response.ok) throw new Error(`Version check failed (${response.status})`);
    return response.json();
  }

  async function clearAppCaches() {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ttg-')).map(key => caches.delete(key)));
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(LOCAL_VERSION)}`, { scope: './', updateViaCache: 'none' });
      await registration.update();
    } catch (error) {
      console.warn('[TTG Update Manager] Service worker registration failed:', error);
    }
  }

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(LOCAL_VERSION)}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Unable to load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function startGame() {
    await loadScript('./data.js');
    await loadScript('./assets/config/imageManager.js');
    await loadScript('./game.js');
  }

  async function boot() {
    let shouldReload = false;
    try {
      const latest = await fetchLatestVersion();
      const latestVersion = String(latest.version || '');
      if (latestVersion && latestVersion !== LOCAL_VERSION) {
        const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);
        if (guard !== latestVersion) {
          sessionStorage.setItem(RELOAD_GUARD_KEY, latestVersion);
          showStatus('UPDATING TAG TEAM GAUNTLET', `Installing version ${latestVersion}…`);
          await clearAppCaches();
          shouldReload = true;
          const url = new URL(location.href);
          url.searchParams.set('ttg-version', latestVersion);
          location.replace(url.toString());
          return;
        }
        console.warn('[TTG Update Manager] Reload guard prevented an update loop.');
      } else {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
      }
    } catch (error) {
      console.warn('[TTG Update Manager] Offline or version check unavailable; starting installed version.', error);
    }

    if (!shouldReload) {
      await registerServiceWorker();
      await startGame();
    }
  }

  window.TTG_UPDATE_MANAGER = { boot, localVersion: LOCAL_VERSION };
  window.addEventListener('DOMContentLoaded', boot, { once: true });
})();
