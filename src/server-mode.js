/* c213 — server authentication gate.
 *
 * The app can be opened in two modes:
 *   • local mode  — GitHub Pages / Vite preview / file:// (legacy, unchanged)
 *   • server mode — any other origin (localhost:8080, Tailscale, NAS)
 *
 * In server mode the server session is the source of truth. The gate checks
 * /api/auth/me before the app boots, opens a tenant-specific IndexedDB cache,
 * and hides the legacy local-password login behind a full-screen gate.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search || '');
  var host = location.hostname || '';
  var isGitHub = /\.github\.io$/i.test(host);
  var isVite = location.port === '5173' || location.port === '4173';
  var isFile = location.protocol === 'file:';
  var enabled = !isGitHub && !isVite && !isFile;
  if (params.get('server') === '0') enabled = false;
  if (params.get('server') === '1') enabled = true;

  /* Browser permission prompts (notifications / autoplay) can reject while the
     app is booting. They must never surface as an unhandled page error, in
     either local or server mode. */
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    if (reason && reason.name === 'NotAllowedError') {
      event.preventDefault();
    }
  });

  if (!enabled) {
    window.DKG_SERVER = {
      enabled: false,
      authenticated: false,
      ready: Promise.resolve(false),
      user: null,
      tenant: null,
      role: null,
      tenantId: null,
      logout: function () {}
    };
    return;
  }

  var state = {
    enabled: true,
    authenticated: false,
    user: null,
    tenant: null,
    role: null,
    tenantId: null,
    dbName: null,
    ready: null,
    logout: null
  };
  window.DKG_SERVER = state;

  document.documentElement.classList.add('dkg-server-gate');

  function $(id) { return document.getElementById(id); }
  function gate() { return $('dkg-server-gate'); }
  function show(el) { if (el) el.hidden = false; }
  function hide(el) { if (el) el.hidden = true; }
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }

  function showChecking() {
    show(gate());
    show($('dkg-gate-checking'));
    hide($('dkg-gate-login'));
    hide($('dkg-gate-offline'));
  }

  function showOffline(message) {
    show(gate());
    hide($('dkg-gate-checking'));
    hide($('dkg-gate-login'));
    show($('dkg-gate-offline'));
    var p = $('dkg-gate-offline-message');
    if (p && message) p.textContent = message;
  }

  function showLogin(message) {
    show(gate());
    hide($('dkg-gate-checking'));
    hide($('dkg-gate-offline'));
    show($('dkg-gate-login'));
    var err = $('dkg-gate-error');
    if (err) {
      if (message) { err.textContent = message; err.hidden = false; }
      else { err.textContent = ''; err.hidden = true; }
    }
    setTimeout(function () {
      var email = $('dkg-gate-email');
      if (email && !email.value) email.focus();
    }, 60);
  }

  function hideGate() {
    document.documentElement.classList.remove('dkg-server-gate');
    hide(gate());
  }

  function getCookie(name) {
    var parts = (document.cookie || '').split(';');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.indexOf(name + '=') === 0) return decodeURIComponent(part.slice(name.length + 1));
    }
    return '';
  }

  function rememberTenant(user, tenant) {
    var dbName = user.role === 'director' ? 'fitness_crm_db' : ('fitness_crm_db_' + tenant.id);
    var previous = null;
    try { previous = localStorage.getItem('dkg_db_name'); } catch (_) {}
    try {
      localStorage.setItem('dkg_db_name', dbName);
      localStorage.setItem('dkg_tenant_id', tenant.id);
      localStorage.setItem('dkg_tenant_name', tenant.name || '');
      localStorage.setItem('dkg_user_role', user.role);
      localStorage.setItem('dkg_user_email', user.email || '');
    } catch (_) {}
    state.dbName = dbName;
    return previous !== dbName;
  }

  async function checkSession() {
    showChecking();
    try {
      var res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'accept': 'application/json' }
      });

      if (res.status === 401) {
        showLogin('');
        return false;
      }
      if (!res.ok) {
        showLogin('Сервер вернул ' + res.status + '. Попробуйте ещё раз.');
        return false;
      }

      var data = await res.json();
      if (!data || !data.user || !data.tenant) {
        showLogin('Сервер вернул неполный ответ. Попробуйте ещё раз.');
        return false;
      }

      state.authenticated = true;
      state.user = data.user;
      state.tenant = data.tenant;
      state.role = data.user.role;
      state.tenantId = data.tenant.id;

      var changed = rememberTenant(data.user, data.tenant);
      if (changed && !sessionStorage.getItem('dkg_db_reloaded')) {
        try { sessionStorage.setItem('dkg_db_reloaded', '1'); } catch (_) {}
        if (window.dkAllowClose) window.dkAllowClose();
        location.reload();
        return true;
      }
      try { sessionStorage.removeItem('dkg_db_reloaded'); } catch (_) {}

      hideGate();
      return true;
    } catch (error) {
      showOffline('Не удалось связаться с сервером. Проверьте интернет и повторите.');
      return false;
    }
  }

  async function submitLogin(event) {
    if (event) event.preventDefault();
    var emailEl = $('dkg-gate-email');
    var passwordEl = $('dkg-gate-password');
    var submitEl = $('dkg-gate-submit');
    var errEl = $('dkg-gate-error');
    if (!emailEl || !passwordEl) return;

    var email = emailEl.value.trim();
    var password = passwordEl.value;
    if (!email || !password) {
      if (errEl) { errEl.textContent = 'Введите email и пароль.'; errEl.hidden = false; }
      return;
    }

    if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    if (submitEl) { submitEl.disabled = true; submitEl.textContent = 'Входим…'; }

    try {
      var res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        var msg = (data && data.error && data.error.message) || 'Неверный email или пароль.';
        if (res.status === 429) msg = 'Слишком много попыток. Подождите минуту.';
        if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
        return;
      }

      rememberTenant(data.user, data.tenant);
      try { sessionStorage.removeItem('dkg_db_reloaded'); } catch (_) {}
      if (window.dkAllowClose) window.dkAllowClose();
      location.reload();
    } catch (error) {
      if (errEl) {
        errEl.textContent = 'Нет связи с сервером. Проверьте интернет и повторите.';
        errEl.hidden = false;
      }
    } finally {
      if (submitEl) { submitEl.disabled = false; submitEl.textContent = 'Войти'; }
    }
  }

  async function logout() {
    var csrf = getCookie('dkg_csrf');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'x-csrf-token': csrf, 'accept': 'application/json' }
      });
    } catch (_) {}
    state.authenticated = false;
    try {
      localStorage.setItem('dkg_db_name', 'fitness_crm_db_gate');
      localStorage.removeItem('dkg_tenant_id');
      localStorage.removeItem('dkg_tenant_name');
      localStorage.removeItem('dkg_user_role');
      localStorage.removeItem('dkg_user_email');
      sessionStorage.removeItem('dkg_db_reloaded');
    } catch (_) {}
    if (window.dkAllowClose) window.dkAllowClose();
    location.reload();
  }

  state.logout = logout;

  state.ready = (async function () {
    if (document.readyState === 'loading') {
      await new Promise(function (resolve) {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    var form = $('dkg-gate-form');
    if (form) form.addEventListener('submit', submitLogin);
    var retry = $('dkg-gate-retry');
    if (retry) retry.addEventListener('click', function () { checkSession(); });

    var forgot = $('dkg-gate-forgot');
    if (forgot) forgot.addEventListener('click', async function (event) {
      if (event) event.preventDefault();
      var emailEl = $('dkg-gate-email');
      var email = emailEl ? emailEl.value.trim() : '';
      var err = $('dkg-gate-error');
      var notice = $('dkg-gate-notice');
      if (!email) {
        if (err) { err.textContent = 'Сначала введите email.'; err.hidden = false; }
        if (emailEl) emailEl.focus();
        return;
      }
      if (err) err.hidden = true;
      if (notice) notice.hidden = true;
      try {
        await fetch('/api/auth/forgot', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json', 'accept': 'application/json' },
          body: JSON.stringify({ email: email })
        });
        if (notice) {
          notice.textContent = 'Если аккаунт с таким email есть, письмо отправлено. Проверьте почту и папку «Спам».';
          notice.hidden = false;
        }
      } catch (e) {
        if (err) {
          err.textContent = 'Не удалось отправить письмо. Проверьте интернет и попробуйте ещё раз.';
          err.hidden = false;
        }
      }
    });

    return checkSession();
  })();
})();
