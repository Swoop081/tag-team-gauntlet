/* LEGACY Pro Wrestling Update Manager 1.2 — direct boot-safe edition */
(() => {
  'use strict';

  const LOCAL_VERSION = String(window.TTG_APP_VERSION || '0.0.0');
  const VERSION_URL = './version.json';
  const RELOAD_GUARD_KEY = 'ttg_update_reload_guard';

  function showStatus(title, message) {
    let el = document.getElementById('ttg-update-status');
    if (!el) {
      const style = document.createElement('style');
      style.textContent = '#ttg-update-status{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;background:#080a10;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:24px}#ttg-update-status .update-card{width:min(420px,92vw);padding:28px;border:2px solid rgba(255,255,255,.18);border-radius:18px;background:#111521}#ttg-update-status strong,#ttg-update-status span{display:block}#ttg-update-status strong{font-size:1.35rem;margin-bottom:10px}';
      document.head.appendChild(style);
      el = document.createElement('div');
      el.id = 'ttg-update-status';
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="update-card"><strong>${title}</strong><span>${message}</span></div>`;
  }

  async function clearAppCaches() {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ttg-') || key.startsWith('lpw-')).map(key => caches.delete(key)));
  }

  async function checkForUpdate() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`${VERSION_URL}?check=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      if (!response.ok) return;
      const latest = await response.json();
      const latestVersion = String(latest.version || '');
      if (!latestVersion || latestVersion === LOCAL_VERSION) {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
        return;
      }
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === latestVersion) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, latestVersion);
      showStatus('UPDATING LEGACY PRO WRESTLING', `Installing version ${latestVersion}…`);
      await clearAppCaches();
      const url = new URL(location.href);
      url.searchParams.set('ttg-version', latestVersion);
      location.replace(url.toString());
    } catch (error) {
      console.warn('[TTG Update Manager] Version check skipped:', error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    try {
      const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(LOCAL_VERSION)}`, { scope: './', updateViaCache: 'none' });
      registration.update();
    } catch (error) {
      console.warn('[TTG Update Manager] Service worker registration failed:', error);
    }
  }

  window.addEventListener('DOMContentLoaded', async () => {
    await checkForUpdate();
    await registerServiceWorker();
  }, { once: true });
})();
