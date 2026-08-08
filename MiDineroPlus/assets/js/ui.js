/**
 * ui.js - Componentes de interfaz reutilizables
 * Versión con iconos Font Awesome + actualización de tema en Configuración
 */

const UI = {
  // ---------- Tema ----------
  applyTheme() {
    const settings = Storage.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
    this.updateCurrencyLabels();
  },

  updateCurrencyLabels(root = document.body) {
    const settings = Storage.getSettings();
    const currency = settings.currency || 'COP';
    const symbols = { COP: '$', USD: 'US$', EUR: '€' };
    const symbol = symbols[currency] || '$';

    // Actualizar texto de etiquetas que contengan símbolos de moneda
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walk.nextNode()) {
      let text = node.nodeValue;
      // Reemplazar cualquier símbolo de moneda anterior por el nuevo
      if (/\(\$\)|\(COP\)|\(USD\)|\(US\$\)|\(EUR\)|\(€\)/.test(text)) {
        node.nodeValue = text.replace(/\(\$\)|\(COP\)|\(USD\)|\(US\$\)|\(EUR\)|\(€\)/g, `(${symbol})`);
      }
    }

    // Disparar evento personalizado para que las páginas re-rendericen sus datos
    document.dispatchEvent(new CustomEvent('currencyChanged', {
      detail: { currency, symbol }
    }));
  },

  toggleTheme() {
    const settings = Storage.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    Storage.updateSetting('theme', newTheme);
    this.applyTheme();

    const currentPage = document.body.dataset.page || '';
    this.renderNavbar(currentPage);

    this.showToast(newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'info');

    // Actualizar el badge de "Tema actual" si estamos en Configuración
    if (typeof Profile !== 'undefined' && Profile.loadSettings) {
      Profile.loadSettings();
    }
  },

  // ---------- Toasts ----------
  showToast(message, type = 'success', duration = 3200) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span style="font-size:1.2rem">${icons[type] || 'ℹ'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // ---------- Modal genérico ----------
  showModal({ title, body, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, danger = false }) {
    const old = document.querySelector('.modal-overlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">${body}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" data-action="cancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.updateCurrencyLabels(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));

    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 250);
    };

    overlay.querySelector('.modal-close').onclick = close;
    overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.querySelector('[data-action="confirm"]').onclick = () => {
      if (typeof onConfirm === 'function') onConfirm();
      close();
    };
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  },

  // ---------- Navbar ----------
  renderNavbar(activePage = '') {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const unread = Storage.getUnreadCount();
    const settings = Storage.getSettings();
    const nav = document.getElementById('navbar');
    if (!nav) return;

    const base = window.location.pathname.includes('/views/') ? '' : 'views/';
    const assetBase = window.location.pathname.includes('/views/') ? '../' : '';

    const isDark = settings.theme === 'dark';
    const themeIcon = isDark ? 'fa-sun' : 'fa-moon';
    const themeTitle = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

    nav.innerHTML = `
      <div class="navbar-inner">
        <a href="${base}dashboard.html" class="navbar-brand">
          <img src="${assetBase}assets/img/logo.png" alt="Mi Dinero+" onerror="this.style.display='none'">
          <span>
            Mi Dinero+
            <small>Meta Autos Medellín</small>
          </span>
        </a>

        <nav class="navbar-nav">
          <a href="${base}dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">📊 Tablero Principal</a>
          <a href="${base}transacciones.html" class="nav-link ${activePage === 'transacciones' ? 'active' : ''}">🪙 Transacciones</a>
          <a href="${base}metas.html" class="nav-link ${activePage === 'metas' ? 'active' : ''}">🎯 Metas de Ahorro</a>
          <a href="${base}deudas.html" class="nav-link ${activePage === 'deudas' ? 'active' : ''}">📉 Gestión de Deudas</a>
          <a href="${base}perfil.html" class="nav-link ${activePage === 'perfil' ? 'active' : ''}">👤 Mi Perfil</a>
        </nav>

        <div class="navbar-actions">
          <button class="theme-toggle" onclick="UI.toggleTheme()" title="${themeTitle}">
            <i class="fa-solid ${themeIcon}"></i>
          </button>

          <div style="position:relative">
            <button class="notif-btn" id="notifBtn" title="Notificaciones">
              <i class="fa-solid fa-bell"></i>
              ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
            </button>
            <div class="notif-panel" id="notifPanel"></div>
          </div>

          <button class="btn-logout" onclick="Auth.logout()">
            <span>EXIT</span>
          </button>

          <button class="menu-toggle" onclick="UI.toggleMobileMenu()" aria-label="Menú">☰</button>
        </div>
      </div>
    `;

    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
      notifBtn.onclick = (e) => {
        e.stopPropagation();
        UI.toggleNotifPanel();
      };
    }

    // Menú móvil
    let mobileMenu = document.getElementById('mobileMenu');
    let backdrop = document.getElementById('mobileBackdrop');

    if (!mobileMenu) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobileBackdrop';
      backdrop.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:190;';
      backdrop.onclick = () => UI.toggleMobileMenu(false);
      document.body.appendChild(backdrop);

      mobileMenu = document.createElement('div');
      mobileMenu.id = 'mobileMenu';
      mobileMenu.className = 'mobile-menu';
      document.body.appendChild(mobileMenu);
    }

    mobileMenu.innerHTML = `
      <div style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center">
        <strong style="color:white;font-size:1.1rem">Menú</strong>
        <button onclick="UI.toggleMobileMenu(false)" style="background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;line-height:1">×</button>
      </div>
      <a href="${base}dashboard.html" class="nav-link" onclick="UI.toggleMobileMenu(false)">📊 Tablero Principal</a>
      <a href="${base}transacciones.html" class="nav-link" onclick="UI.toggleMobileMenu(false)">🪙 Transacciones</a>
      <a href="${base}metas.html" class="nav-link" onclick="UI.toggleMobileMenu(false)">🎯 Metas de Ahorro</a>
      <a href="${base}deudas.html" class="nav-link" onclick="UI.toggleMobileMenu(false)">📉 Gestión de Deudas</a>
      <a href="${base}perfil.html" class="nav-link" onclick="UI.toggleMobileMenu(false)">👤 Mi Perfil</a>
      <hr style="border-color:rgba(255,255,255,0.15);margin:1rem 0">
      <button class="nav-link" onclick="UI.toggleTheme();UI.toggleMobileMenu(false)" style="width:100%;background:none;border:none;cursor:pointer;text-align:left">
        <i class="fa-solid ${themeIcon}"></i>
        ${isDark ? ' Modo Claro' : ' Modo Oscuro'}
      </button>
      <button class="mobile-exit-btn" onclick="Auth.logout()">
        EXIT
      </button>
    `;
  },

  toggleMobileMenu(forceClose = null) {
    const menu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('mobileBackdrop');
    if (!menu) return;

    const isOpen = menu.classList.contains('show');
    const shouldOpen = forceClose === false ? false : forceClose === true ? true : !isOpen;

    if (shouldOpen) {
      menu.classList.add('show');
      if (backdrop) backdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      menu.classList.remove('show');
      if (backdrop) backdrop.style.display = 'none';
      document.body.style.overflow = '';
    }
  },

  // ---------- Panel de Notificaciones ----------
  toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;

    const isOpen = panel.classList.contains('show');

    if (isOpen) {
      panel.classList.remove('show');
      return;
    }

    Storage.markNotificationsRead();

    const currentPage = document.body.dataset.page || '';
    this.renderNavbar(currentPage);

    const freshPanel = document.getElementById('notifPanel');
    if (!freshPanel) return;

    const notifs = Storage.getNotifications().slice(0, 5);
    const base = window.location.pathname.includes('/views/') ? '' : 'views/';

    freshPanel.innerHTML = `
      <div class="notif-panel-header">
        <strong>Notificaciones</strong>
        <small class="text-muted">${notifs.length} recientes</small>
      </div>
      <div class="notif-list">
        ${notifs.length === 0 
          ? `<div class="empty-state" style="padding:1.5rem"><p>No hay notificaciones</p></div>` 
          : notifs.map(n => `
              <div class="notif-item ${n.read ? '' : 'unread'}">
                <div class="notif-title">${n.title}</div>
                <div class="text-sm text-muted">${n.message || ''}</div>
                <div class="notif-time">${Utils.formatDateTime(n.createdAt)}</div>
              </div>
            `).join('')
        }
      </div>
      <div class="notif-panel-footer">
        <a href="${base}perfil.html?section=notifications" class="text-accent font-semibold text-sm">Ver todas →</a>
      </div>
    `;

    freshPanel.classList.add('show');

    setTimeout(() => {
      const closeHandler = (e) => {
        if (!freshPanel.contains(e.target) && !e.target.closest('.notif-btn')) {
          freshPanel.classList.remove('show');
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 10);
  },

  // ---------- Banner educativo ----------
  initEduBanner() {
    const banner = document.querySelector('.edu-banner');
    if (!banner) return;

    const closeBtn = banner.querySelector('.close-banner');
    if (closeBtn) {
      closeBtn.onclick = () => {
        banner.style.display = 'none';
        sessionStorage.setItem('md_banner_closed', '1');
      };
    }

    if (sessionStorage.getItem('md_banner_closed') === '1') {
      banner.style.display = 'none';
    }
  },

  // ---------- Password toggle + strength ----------
  initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.onclick = () => {
        const input = btn.parentElement.querySelector('input');
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🙈' : '👁️';
      };
    });
  },

  updatePasswordStrength(inputId, barId) {
    const input = document.getElementById(inputId);
    const bar = document.getElementById(barId);
    if (!input || !bar) return;

    input.addEventListener('input', () => {
      const strength = Utils.getPasswordStrength(input.value);
      bar.className = 'password-strength-bar';
      if (strength === 1) bar.classList.add('weak');
      else if (strength === 2) bar.classList.add('medium');
      else if (strength === 3) bar.classList.add('strong');
    });
  },

  resetScroll() {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }
};

window.UI = UI;
