/**
 * goals.js - Lógica del módulo de Metas de Ahorro
 */

const Goals = {
  init() {
    if (!Auth.requireAuth()) return;

    UI.applyTheme();
    Animations.init();
    UI.resetScroll();
    UI.initEduBanner();
    UI.renderNavbar('metas');

    this.cacheDOM();
    this.bindEvents();
    this.renderAll();
    this.renderAIAssistant();
  },

  cacheDOM() {
    this.form = document.getElementById('goalForm');
    this.nameInput = document.getElementById('goalName');
    this.targetInput = document.getElementById('goalTarget');
    this.deadlineInput = document.getElementById('goalDeadline');
    this.prioritySelect = document.getElementById('goalPriority');
    this.listEl = document.getElementById('goalsList');
    this.totalEl = document.getElementById('totalAhorrado');
  },

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreate();
      });
    }

    // Fecha mínima = hoy
    if (this.deadlineInput) {
      this.deadlineInput.min = Utils.today();
    }
  },

  handleCreate() {
    const name = this.nameInput.value.trim();
    const target = parseFloat(this.targetInput.value);
    const deadline = this.deadlineInput.value;
    const priority = this.prioritySelect.value;

    if (!name) {
      UI.showToast('Escribe el nombre de la meta', 'error');
      this.nameInput.focus();
      return;
    }
    if (!target || target <= 0) {
      UI.showToast('Ingresa un monto objetivo válido', 'error');
      this.targetInput.focus();
      return;
    }
    if (!deadline) {
      UI.showToast('Selecciona una fecha límite', 'error');
      return;
    }
    if (!priority) {
      UI.showToast('Selecciona una prioridad', 'error');
      return;
    }

    const goal = {
      id: Utils.generateId(),
      name,
      target,
      current: 0,
      deadline,
      priority,
      createdAt: new Date().toISOString()
    };

    Storage.addGoal(goal);

    Storage.addNotification({
      id: Utils.generateId(),
      title: 'Nueva meta creada',
      message: `${name} – Objetivo: ${Utils.formatMoney(target)}`,
      type: 'goal',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.form.reset();
    this.renderAll();
    UI.renderNavbar('metas');
    UI.showToast('Meta creada correctamente', 'success');
    this.triggerAI('create', goal);
  },

  renderAll() {
    this.renderTotal();
    this.renderList();
  },

  renderTotal() {
    const goals = Storage.getGoals();
    const total = goals.reduce((sum, g) => sum + Number(g.current || 0), 0);
    if (this.totalEl) this.totalEl.textContent = Utils.formatMoney(total);
  },

  renderList() {
    if (!this.listEl) return;

    const goals = Storage.getGoals();

    if (goals.length === 0) {
      this.listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p>Aún no tienes metas de ahorro.</p>
          <p class="text-sm text-muted">Crea tu primera meta usando el formulario.</p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = goals.map(g => {
      const progress = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0;
      const remaining = Math.max(g.target - g.current, 0);
      const isCompleted = g.current >= g.target;

      const priorityMap = {
        alta: { label: 'Alta', class: 'badge-danger' },
        media: { label: 'Media', class: 'badge-warning' },
        baja: { label: 'Baja', class: 'badge-info' }
      };
      const prio = priorityMap[g.priority] || priorityMap.media;

      return `
        <div class="goal-card ${isCompleted ? 'completed' : ''}" data-id="${g.id}">
          <div class="goal-card-header">
            <div>
              <div class="goal-name">${g.name}</div>
              <div class="goal-meta">
                <span class="badge ${prio.class}">${prio.label}</span>
                <span class="text-sm text-muted">Límite: ${Utils.formatDate(g.deadline)}</span>
              </div>
            </div>
            <button class="goal-delete" onclick="Goals.confirmDelete('${g.id}')" title="Eliminar meta">🗑️</button>
          </div>

          <div class="goal-amounts">
            <span class="current">${Utils.formatMoney(g.current)}</span>
            <span class="target">de ${Utils.formatMoney(g.target)}</span>
          </div>

          <div class="progress" style="height:10px;margin:0.6rem 0 0.4rem;">
            <div class="progress-bar ${isCompleted ? '' : ''}" style="width:${progress}%; background:${isCompleted ? 'var(--success)' : 'var(--accent)'}"></div>
          </div>
          <div class="d-flex justify-between text-sm text-muted">
            <span>${progress}% completado</span>
            <span>${isCompleted ? '¡Meta cumplida!' : `Faltan ${Utils.formatMoney(remaining)}`}</span>
          </div>

          ${!isCompleted ? `
            <button class="btn btn-outline btn-sm mt-2" style="width:100%" onclick="Goals.openContribute('${g.id}')">
              ➕ Aportar a meta
            </button>
          ` : `
            <div class="completed-badge mt-2">🎉 ¡Meta alcanzada!</div>
          `}
        </div>
      `;
    }).join('');
  },

  openContribute(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const remaining = Math.max(goal.target - goal.current, 0);

    UI.showModal({
      title: `Aportar a: ${goal.name}`,
      body: `
        <p class="text-sm text-muted mb-2">Monto pendiente: <strong>${Utils.formatMoney(remaining)}</strong></p>
        <div class="form-group">
          <label class="form-label">Monto a aportar ($)</label>
          <input type="number" id="contributeAmount" class="form-control" placeholder="0" min="1" max="${remaining}" step="1">
        </div>
      `,
      confirmText: 'Aportar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const input = document.getElementById('contributeAmount');
        const amount = parseFloat(input?.value);
        if (!amount || amount <= 0) {
          UI.showToast('Ingresa un monto válido', 'error');
          return;
        }
        if (amount > remaining) {
          UI.showToast('El aporte no puede superar el monto pendiente', 'error');
          return;
        }
        this.contribute(id, amount);
      }
    });

    // Focus al input después de abrir el modal
    setTimeout(() => {
      const input = document.getElementById('contributeAmount');
      if (input) input.focus();
    }, 100);
  },

  contribute(id, amount) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newCurrent = Math.min(goal.current + amount, goal.target);
    const isCompleted = newCurrent >= goal.target;

    Storage.updateGoal(id, { current: newCurrent });

    Storage.addNotification({
      id: Utils.generateId(),
      title: isCompleted ? '¡Meta completada!' : 'Aporte registrado',
      message: isCompleted
        ? `Has alcanzado la meta "${goal.name}"`
        : `Aporte de ${Utils.formatMoney(amount)} a "${goal.name}"`,
      type: 'goal',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.renderAll();
    UI.renderNavbar('metas');
    UI.showToast(isCompleted ? '🎉 ¡Felicidades! Meta completada' : 'Aporte registrado', 'success');
    this.triggerAI(isCompleted ? 'complete' : 'contribute', { ...goal, current: newCurrent, amount });
  },

  confirmDelete(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    UI.showModal({
      title: 'Eliminar meta',
      body: `<p>¿Seguro que deseas eliminar la meta <strong>"${goal.name}"</strong>? Esta acción no se puede deshacer.</p>`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => this.deleteGoal(id)
    });
  },

  deleteGoal(id) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    Storage.deleteGoal(id);

    Storage.addNotification({
      id: Utils.generateId(),
      title: 'Meta eliminada',
      message: `"${goal.name}" fue eliminada`,
      type: 'goal',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.renderAll();
    UI.renderNavbar('metas');
    UI.showToast('Meta eliminada', 'success');
  },

  // ---------- Asistente IA ----------
  renderAIAssistant() {
    const el = document.getElementById('aiAssistant');
    if (!el) return;

    const settings = Storage.getSettings();
    if (!settings.aiEnabled) {
      el.style.display = 'none';
      return;
    }

    el.innerHTML = `
      <div class="ai-icon"> </div>
      <div class="ai-content">
        <div class="ai-title">ASISTENTE FINANCIERO </div>
        <div class="ai-message">Bienvenido de nuevo. Estoy listo para ayudarte a tomar mejores decisiones financieras.</div>
      </div>
    `;
  },

  triggerAI(action, data) {
    const el = document.getElementById('aiAssistant');
    if (!el) return;

    const settings = Storage.getSettings();
    if (!settings.aiEnabled) return;

    el.innerHTML = `
      <div class="ai-icon"> </div>
      <div class="ai-content">
        <div class="ai-title">ASISTENTE FINANCIERO </div>
        <div class="ai-message analyzing">
          <div class="ai-spinner"></div>
          Analizando tu movimiento…
        </div>
      </div>
    `;

    setTimeout(() => {
      const tip = this.getAITip(action, data);
      el.innerHTML = `
        <div class="ai-icon"> </div>
        <div class="ai-content">
          <div class="ai-title">ASISTENTE FINANCIERO </div>
          <div class="ai-message">${tip}</div>
        </div>
      `;
    }, 1100);
  },

  getAITip(action, data) {
    const level = Storage.getSettings().educationLevel || 'basico';

    const tips = {
      create: {
        basico: [
          `¡Excelente! Creaste la meta "${data.name}". Ahora solo falta aportar de forma constante.`,
          `Meta registrada. Recuerda: metas claras + aportes regulares = resultados.`
        ],
        intermedio: [
          `Meta "${data.name}" creada con prioridad ${data.priority}. Define un aporte semanal para llegar a tiempo.`,
          `Buen inicio. Calcula cuánto necesitas aportar mensualmente para cumplir el plazo.`
        ],
        avanzado: [
          `Meta creada. Evalúa si el plazo es realista según tu capacidad de ahorro actual.`,
          `Objetivo definido. Considera automatizar un porcentaje de tus ingresos hacia esta meta.`
        ]
      },
      contribute: {
        basico: [
          `Aporte de ${Utils.formatMoney(data.amount)} registrado. ¡Sigue así!`,
          `Cada aporte cuenta. Vas por buen camino hacia "${data.name}".`
        ],
        intermedio: [
          `Aporte realizado. Tu progreso en "${data.name}" sigue creciendo de forma constante.`,
          `Buen movimiento. Revisa si puedes aumentar un poco el próximo aporte.`
        ],
        avanzado: [
          `Aporte registrado. Mantén la disciplina y revisa tu tasa de ahorro global.`,
          `Progreso actualizado. Evalúa el impacto de este aporte en tu flujo de caja mensual.`
        ]
      },
      complete: {
        basico: [
          `🎉 ¡Felicidades! Completaste la meta "${data.name}". ¡Gran logro!`,
          `¡Lo lograste! Ahora puedes crear una nueva meta o celebrar este avance.`
        ],
        intermedio: [
          `Meta cumplida. Este éxito demuestra que la constancia funciona. ¿Cuál será la siguiente?`,
          `¡Objetivo alcanzado! Considera reinvertir parte de este logro en una nueva meta.`
        ],
        avanzado: [
          `Meta finalizada con éxito. Analiza qué estrategias te funcionaron para replicarlas.`,
          `Excelente ejecución. Usa este momentum para atacar una meta de mayor envergadura.`
        ]
      }
    };

    const list = tips[action]?.[level] || tips[action]?.basico || ['Acción registrada correctamente.'];
    return list[Math.floor(Math.random() * list.length)];
  }
};

document.addEventListener('DOMContentLoaded', () => Goals.init());
