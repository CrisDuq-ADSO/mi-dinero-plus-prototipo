/**
 * profile.js - Lógica de Mi Perfil
 */

const Profile = {
  currentSection: 'main',

  ROLES: [
    'Asesor Comercial',
    'Conductor',
    'Seguridad',
    'Limpieza',
    'Contador',
    'Administrativo',
    'Otro'
  ],

  COLORS: [
    '#1D4ED8', '#7C3AED', '#DB2777', '#DC2626',
    '#EA580C', '#CA8A04', '#16A34A', '#0D9488',
    '#0891B2', '#fdfdff'
  ],

  ANIMALS: ['🐭', '🐻', '🐯', '🐰', '🐲', '🐙', '🦊', '🐮', '🐵', '🐸', '🐶', '🐷'],

  LEVELS: [
    { name: 'Aprendiz Financiero',   min: 0  },
    { name: 'Organizador Financiero', min: 25 },
    { name: 'Planificador Financiero', min: 55 },
    { name: 'Experto Financiero',    min: 80 }
  ],

  init() {
    if (!Auth.requireAuth()) return;

    UI.applyTheme();
    Animations.init();
    UI.resetScroll();
    UI.initEduBanner();
    UI.renderNavbar('perfil');

    this.ensureUserDefaults();
    this.cacheDOM();
    this.bindEvents();
    this.renderProfile();
    this.handleSectionFromURL();
  },

  ensureUserDefaults() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    let changed = false;
    if (!user.role) { user.role = 'Asesor Comercial'; changed = true; }
    if (!user.avatar) {
      user.avatar = { type: 'initial', value: user.fullName.charAt(0).toUpperCase(), color: '#1D4ED8' };
      changed = true;
    }
    if (typeof user.progress !== 'number') { user.progress = 0; changed = true; }
    if (!user.level) { user.level = 'Aprendiz Financiero'; changed = true; }

    if (changed) Auth.updateUser(user);
  },

  cacheDOM() {
    this.profileCard = document.getElementById('profileCard');
    this.sectionMain = document.getElementById('sectionMain');
    this.sectionActivity = document.getElementById('sectionActivity');
    this.sectionSecurity = document.getElementById('sectionSecurity');
    this.sectionSettings = document.getElementById('sectionSettings');
  },

  bindEvents() {
    document.querySelectorAll('[data-section]').forEach(btn => {
      btn.addEventListener('click', () => this.showSection(btn.dataset.section));
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', () => this.showSection('main'));
    });

    const passForm = document.getElementById('changePassForm');
    if (passForm) {
      passForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }

    const emailForm = document.getElementById('changeEmailForm');
    if (emailForm) {
      emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangeEmail();
      });
    }

    const currencySelect = document.getElementById('settingCurrency');
    if (currencySelect) {
      currencySelect.addEventListener('change', () => {
        const oldCurrency = Storage.getSettings().currency || 'COP';
        const newCurrency = currencySelect.value;
        if (oldCurrency !== newCurrency) {
          Storage.convertCurrency(oldCurrency, newCurrency);
          Storage.updateSetting('currency', newCurrency);
          UI.updateCurrencyLabels();
          UI.showToast('Moneda actualizada y saldos convertidos', 'success');
        }
      });
    }

    const levelSelect = document.getElementById('settingLevel');
    if (levelSelect) {
      levelSelect.addEventListener('change', () => {
        Storage.updateSetting('educationLevel', levelSelect.value);
        UI.showToast('Nivel educativo actualizado', 'success');
      });
    }

    const aiToggle = document.getElementById('settingAI');
    if (aiToggle) {
      aiToggle.addEventListener('change', () => {
        Storage.updateSetting('aiEnabled', aiToggle.checked);
        UI.showToast(aiToggle.checked ? 'Asistente IA activado' : 'Asistente IA desactivado', 'info');
      });
    }

    const animToggle = document.getElementById('settingAnimations');
    if (animToggle) {
      animToggle.addEventListener('change', () => {
        Animations.toggle(animToggle.checked);
        UI.showToast(animToggle.checked ? 'Animaciones activadas' : 'Animaciones desactivadas', 'info');
      });
    }

    const btnReset = document.getElementById('btnResetSimulation');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.confirmReset());
    }
  },

  handleSectionFromURL() {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section === 'notifications') this.showSection('activity');
    else if (section === 'security') this.showSection('security');
    else if (section === 'simulation-settings') this.showSection('settings');
    else this.showSection('main');
  },

  showSection(section) {
    this.currentSection = section;

    [this.sectionMain, this.sectionActivity, this.sectionSecurity, this.sectionSettings].forEach(el => {
      if (el) el.classList.add('hidden');
    });

    if (section === 'main' && this.sectionMain) {
      this.sectionMain.classList.remove('hidden');
      this.renderProfile();
    }
    if (section === 'activity' && this.sectionActivity) {
      this.sectionActivity.classList.remove('hidden');
      this.renderActivity();
    }
    if (section === 'security' && this.sectionSecurity) {
      this.sectionSecurity.classList.remove('hidden');
      this.fillSecurityData();
    }
    if (section === 'settings' && this.sectionSettings) {
      this.sectionSettings.classList.remove('hidden');
      this.loadSettings();
    }

    const url = new URL(window.location);
    if (section === 'main') url.searchParams.delete('section');
    else {
      const map = { activity: 'notifications', security: 'security', settings: 'simulation-settings' };
      url.searchParams.set('section', map[section] || section);
    }
    window.history.replaceState({}, '', url);
  },

  calculateProgress() {
    const txs = Storage.getTransactions();
    const goals = Storage.getGoals();
    const debts = Storage.getDebts();

    if (txs.length === 0 && goals.length === 0 && debts.length === 0) {
      return { progress: 0, level: 'Aprendiz Financiero' };
    }

    let points = 0;
    points += Math.min(txs.length * 4, 30);
    points += Math.min(goals.length * 6, 25);
    const completedGoals = goals.filter(g => g.current >= g.target).length;
    points += completedGoals * 10;
    points += Math.min(debts.length * 5, 20);
    const paidDebts = debts.filter(d => d.remaining <= 0).length;
    points += paidDebts * 12;

    const progress = Math.min(Math.round(points), 100);

    let level = this.LEVELS[0].name;
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (progress >= this.LEVELS[i].min) {
        level = this.LEVELS[i].name;
        break;
      }
    }

    return { progress, level };
  },

  renderProfile() {
    const user = Auth.getCurrentUser();
    if (!user || !this.profileCard) return;

    const { progress, level } = this.calculateProgress();
    if (user.progress !== progress || user.level !== level) {
      Auth.updateUser({ progress, level });
      user.progress = progress;
      user.level = level;
    }

    const avatar = user.avatar || { type: 'initial', value: user.fullName.charAt(0).toUpperCase(), color: '#1D4ED8' };
    const displayContent = avatar.type === 'animal' ? avatar.value : avatar.value;

    const wasOpen = document.getElementById('avatarControls')?.classList.contains('show');

    this.profileCard.innerHTML = `
      <div class="profile-card-inner">
        <div class="avatar-wrapper">
          <div class="profile-avatar" id="avatarCircle" style="background:${avatar.color}">
            ${displayContent}
          </div>

          <button class="btn-personalize" onclick="Profile.toggleAvatarControls()">
            🎨 Personalizar
          </button>

          <div class="avatar-controls ${wasOpen ? 'show' : ''}" id="avatarControls">
            <button class="btn-close-controls" onclick="Profile.closeAvatarControls()" title="Cerrar">×</button>

            <div class="control-group">
              <span class="control-label">Color</span>
              <div class="color-palette">
                ${this.COLORS.map(c => `
                  <button class="color-btn ${c === avatar.color ? 'active' : ''}" 
                          style="background:${c}" 
                          onclick="Profile.changeColor('${c}')"
                          title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <div class="control-group">
              <span class="control-label">Avatar</span>
              <div class="animal-palette">
                <button class="animal-btn ${avatar.type === 'initial' ? 'active' : ''}" 
                        onclick="Profile.setInitial()">
                  ${user.fullName.charAt(0).toUpperCase()}
                </button>
                ${this.ANIMALS.map(a => `
                  <button class="animal-btn ${avatar.type === 'animal' && avatar.value === a ? 'active' : ''}" 
                          onclick="Profile.changeAnimal('${a}')">${a}</button>
                `).join('')}
              </div>
            </div>

            <button class="btn-reset-avatar" onclick="Profile.resetAvatar()">
              ↺ Restablecer
            </button>
          </div>
        </div>

        <div class="profile-name">${user.fullName}</div>

        <div class="role-selector">
          <select id="roleSelect" onchange="Profile.changeRole(this.value)">
            ${this.ROLES.map(r => `
              <option value="${r}" ${r === user.role ? 'selected' : ''}>${r}</option>
            `).join('')}
          </select>
        </div>

        <div class="profile-company">${user.company || 'Meta Autos Medellín'}</div>
        <div class="profile-email">${user.email}</div>

        <div class="edu-progress-box">
          <div class="edu-progress-title">PROGRESO EDUCATIVO</div>
          <div class="edu-progress-circle">
            <svg viewBox="0 0 36 36">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="circle-fill" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <div class="circle-text">${progress}%</div>
          </div>
          <div class="edu-level">${level}</div>
        </div>
      </div>
    `;
  },

  toggleAvatarControls() {
    const controls = document.getElementById('avatarControls');
    if (controls) controls.classList.toggle('show');
  },

  closeAvatarControls() {
    const controls = document.getElementById('avatarControls');
    if (controls) controls.classList.remove('show');
  },

  resetAvatar() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const avatar = {
      type: 'initial',
      value: user.fullName.charAt(0).toUpperCase(),
      color: '#1D4ED8'
    };

    Auth.updateUser({ avatar });
    this.renderProfile();

    setTimeout(() => {
      const controls = document.getElementById('avatarControls');
      if (controls) controls.classList.add('show');
    }, 10);

    UI.showToast('Avatar restablecido', 'success');
  },

  changeRole(role) {
    Auth.updateUser({ role });
    UI.showToast('Cargo actualizado', 'success');
  },

  changeColor(color) {
    const user = Auth.getCurrentUser();
    const avatar = { ...(user.avatar || {}), color };
    Auth.updateUser({ avatar });
    this.renderProfile();
  },

  setInitial() {
    const user = Auth.getCurrentUser();
    const avatar = {
      type: 'initial',
      value: user.fullName.charAt(0).toUpperCase(),
      color: user.avatar?.color || '#1D4ED8'
    };
    Auth.updateUser({ avatar });
    this.renderProfile();
  },

  changeAnimal(animal) {
    const user = Auth.getCurrentUser();
    const avatar = {
      type: 'animal',
      value: animal,
      color: user.avatar?.color || '#1D4ED8'
    };
    Auth.updateUser({ avatar });
    this.renderProfile();
  },

  renderActivity() {
    const container = document.getElementById('activityList');
    if (!container) return;

    const notifs = Storage.getNotifications();

    const groups = {
      transaction: { 
        title: 'Transacciones', 
        className: 'transacciones',
        items: [] 
      },
      goal: { 
        title: 'Metas de Ahorro', 
        className: 'metas',
        items: [] 
      },
      debt: { 
        title: 'Gestión de Deudas', 
        className: 'deudas',
        items: [] 
      }
    };

    notifs.forEach(n => {
      if (groups[n.type]) groups[n.type].items.push(n);
    });

    container.innerHTML = `
      <div class="activity-grid">
        ${Object.values(groups).map(group => `
          <div class="activity-column ${group.className}">
            <div class="activity-column-header">
              <span>${group.title}</span>
              <span class="badge badge-info">${group.items.length}</span>
            </div>
            <div class="activity-column-body">
              ${group.items.length === 0
                ? `<div class="empty-mini">Aún no hay actividades registradas.</div>`
                : group.items.map(n => `
                    <div class="activity-item">
                      <div class="activity-title">${n.title}</div>
                      <div class="activity-msg">${n.message || ''}</div>
                      <div class="activity-time">${Utils.formatDateTime(n.createdAt)}</div>
                    </div>
                  `).join('')
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  fillSecurityData() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const nameEl = document.getElementById('displayName');
    const emailEl = document.getElementById('currentEmailDisplay');
    if (nameEl) nameEl.textContent = user.fullName;
    if (emailEl) emailEl.textContent = user.email;
  },

  loadSettings() {
    const settings = Storage.getSettings();

    const currency = document.getElementById('settingCurrency');
    if (currency) currency.value = settings.currency || 'COP';

    const level = document.getElementById('settingLevel');
    if (level) level.value = settings.educationLevel || 'basico';

    const ai = document.getElementById('settingAI');
    if (ai) ai.checked = settings.aiEnabled !== false;

    const anim = document.getElementById('settingAnimations');
    if (anim) anim.checked = settings.animations !== false;

    // Actualizar el badge del tema actual
    const themeLabel = document.getElementById('currentThemeLabel');
    if (themeLabel) {
      const isDark = settings.theme === 'dark';
      themeLabel.textContent = isDark ? 'Modo Oscuro' : 'Modo Claro';
    }
  },

  handleChangePassword() {
    const current = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirm = document.getElementById('confirmNewPass').value;
    const user = Auth.getCurrentUser();
    if (!user) return;

    if (current !== user.password) {
      UI.showToast('La contraseña actual no es correcta', 'error');
      return;
    }
    const check = Utils.validatePassword(newPass);
    if (!check.valid) {
      UI.showToast(check.message, 'error');
      return;
    }
    if (newPass !== confirm) {
      UI.showToast('Las contraseñas nuevas no coinciden', 'error');
      return;
    }

    Auth.updateUser({ password: newPass });
    document.getElementById('changePassForm').reset();
    UI.showToast('Contraseña actualizada correctamente', 'success');
  },

  handleChangeEmail() {
    const newEmail = document.getElementById('newEmail').value.trim();
    const confirmEmail = document.getElementById('confirmNewEmail').value.trim();

    const check = Utils.validateEmail(newEmail);
    if (!check.valid) {
      UI.showToast(check.message, 'error');
      return;
    }
    if (newEmail !== confirmEmail) {
      UI.showToast('Los correos no coinciden', 'error');
      return;
    }

    Auth.updateUser({ email: newEmail.toLowerCase() });
    document.getElementById('changeEmailForm').reset();
    document.getElementById('currentEmailDisplay').textContent = newEmail.toLowerCase();
    UI.showToast('Correo actualizado correctamente', 'success');
  },

  confirmReset() {
    UI.showModal({
      title: 'Reiniciar simulación',
      body: `
        <p>Esta acción eliminará <strong>todas</strong> las transacciones, metas, deudas y notificaciones.</p>
        <p class="text-sm text-muted mt-1">Tu cuenta y configuración se mantendrán.</p>
      `,
      confirmText: 'Sí, reiniciar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => {
        Storage.resetSimulation();
        Auth.updateUser({ progress: 0, level: 'Aprendiz Financiero' });
        UI.showToast('Simulación reiniciada correctamente', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Profile.init());