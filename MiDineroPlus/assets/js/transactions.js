/**
 * transactions.js - Lógica del módulo de Transacciones
 */

const Transactions = {
  currentType: 'gasto', // 'gasto' | 'ingreso'

  categories: {
    gasto: ['Vivienda', 'Alimentación', 'Transporte', 'Servicios', 'Salud', 'Educación', 'Entretenimiento', 'Tecnología', 'Ropa', 'Otros'],
    ingreso: ['Salario', 'Honorarios', 'Ventas', 'Inversiones', 'Bonificaciones', 'Otros ingresos']
  },

  init() {
    if (!Auth.requireAuth()) return;

    UI.applyTheme();
    Animations.init();
    UI.resetScroll();
    UI.initEduBanner();
    UI.renderNavbar('transacciones');

    this.cacheDOM();
    this.bindEvents();
    this.renderCategories();
    this.renderAll();
    this.renderAIAssistant();
  },

  cacheDOM() {
    this.form = document.getElementById('txForm');
    this.typeBtns = document.querySelectorAll('.type-btn');
    this.amountInput = document.getElementById('txAmount');
    this.dateInput = document.getElementById('txDate');
    this.categorySelect = document.getElementById('txCategory');
    this.descInput = document.getElementById('txDescription');
    this.submitBtn = document.getElementById('txSubmit');
    this.historyEl = document.getElementById('txHistory');
    this.totalIngresosEl = document.getElementById('totalIngresos');
    this.totalGastosEl = document.getElementById('totalGastos');
    this.balanceNetoEl = document.getElementById('balanceNeto');
  },

  bindEvents() {
    // Toggle tipo
    this.typeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentType = btn.dataset.type;
        this.typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderCategories();
        this.updateSubmitButton();
      });
    });

    // Submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  },

  // Botón siempre azul
  updateSubmitButton() {
    if (!this.submitBtn) return;

    this.submitBtn.style.background = '#1D4ED8';
    this.submitBtn.style.color = 'white';

    if (this.currentType === 'gasto') {
      this.submitBtn.textContent = 'Registrar Gasto';
    } else {
      this.submitBtn.textContent = 'Registrar Ingreso';
    }
  },

  renderCategories() {
    if (!this.categorySelect) return;
    const cats = this.categories[this.currentType] || [];
    this.categorySelect.innerHTML = '<option value="">Seleccionar...</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  handleSubmit() {
    const amount = parseFloat(this.amountInput.value);
    const date = this.dateInput.value;
    const category = this.categorySelect.value;
    const description = this.descInput.value.trim();

    if (!amount || amount <= 0) {
      UI.showToast('Ingresa un monto válido mayor a 0', 'error');
      this.amountInput.focus();
      return;
    }
    if (!date) {
      UI.showToast('Selecciona una fecha', 'error');
      return;
    }
    if (!category) {
      UI.showToast('Selecciona una categoría', 'error');
      return;
    }
    if (!description) {
      UI.showToast('Escribe una descripción', 'error');
      this.descInput.focus();
      return;
    }

    const tx = {
      id: Utils.generateId(),
      type: this.currentType,
      amount: amount,
      date: date,
      category: category,
      description: description,
      createdAt: new Date().toISOString()
    };

    Storage.addTransaction(tx);

    Storage.addNotification({
      id: Utils.generateId(),
      title: `${this.currentType === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado`,
      message: `${description} – ${Utils.formatMoney(amount)}`,
      type: 'transaction',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.form.reset();
    this.renderCategories();
    this.renderAll();
    UI.renderNavbar('transacciones');

    UI.showToast(
      `${this.currentType === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado correctamente`,
      'success'
    );

    this.triggerAI(tx);
  },

  renderAll() {
    this.renderTotals();
    this.renderHistory();
  },

  renderTotals() {
    const txs = Storage.getTransactions();
    let ingresos = 0;
    let gastos = 0;

    txs.forEach(t => {
      if (t.type === 'ingreso') ingresos += Number(t.amount);
      else gastos += Number(t.amount);
    });

    const balance = ingresos - gastos;

    if (this.totalIngresosEl) this.totalIngresosEl.textContent = Utils.formatMoney(ingresos);
    if (this.totalGastosEl) this.totalGastosEl.textContent = Utils.formatMoney(gastos);

    // ✅ Balance Neto siempre en azul
    if (this.balanceNetoEl) {
      this.balanceNetoEl.textContent = Utils.formatMoney(balance);
      this.balanceNetoEl.style.color = '#3B82F6'; // Azul bonito
    }
  },

  renderHistory() {
    if (!this.historyEl) return;

    const txs = Storage.getTransactions();

    if (txs.length === 0) {
      this.historyEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💳</div>
          <p>Aún no hay movimientos registrados.</p>
        </div>
      `;
      return;
    }

    this.historyEl.innerHTML = txs.map(t => `
      <div class="tx-item" data-id="${t.id}">
        <div class="tx-icon ${t.type}">
          ${t.type === 'ingreso' ? '↑' : '↓'}
        </div>
        <div class="tx-info">
          <div class="tx-desc">${t.description}</div>
          <div class="tx-meta">${t.category} · ${Utils.formatDate(t.date)}</div>
        </div>
        <div class="tx-amount ${t.type}">
          ${t.type === 'ingreso' ? '+' : '-'} ${Utils.formatMoney(t.amount)}
        </div>
        <button class="tx-delete" onclick="Transactions.confirmDelete('${t.id}')" title="Eliminar">
          🗑️
        </button>
      </div>
    `).join('');
  },

  confirmDelete(id) {
    UI.showModal({
      title: 'Eliminar transacción',
      body: '<p>¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.</p>',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => this.deleteTx(id)
    });
  },

  deleteTx(id) {
    const txs = Storage.getTransactions();
    const tx = txs.find(t => t.id === id);
    if (!tx) return;

    Storage.deleteTransaction(id);

    Storage.addNotification({
      id: Utils.generateId(),
      title: 'Movimiento eliminado',
      message: `${tx.description} fue eliminado`,
      type: 'transaction',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.renderAll();
    UI.renderNavbar('transacciones');
    UI.showToast('Transacción eliminada', 'success');
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
        <div class="ai-message">¡Hola! Soy tu Asistente Financiero. ¿Qué deseas gestionar hoy?</div>
      </div>
    `;
  },

  triggerAI(tx) {
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
      const tip = this.getAITip(tx);
      el.innerHTML = `
        <div class="ai-icon"> </div>
        <div class="ai-content">
          <div class="ai-title">ASISTENTE FINANCIERO </div>
          <div class="ai-message">${tip}</div>
        </div>
      `;
    }, 1100);
  },

  getAITip(tx) {
    const level = Storage.getSettings().educationLevel || 'basico';

    if (tx.type === 'ingreso') {
      const tips = {
        basico: [
          `¡Bien! Registraste un ingreso de ${Utils.formatMoney(tx.amount)}. Recuerda destinar una parte al ahorro.`,
          `Ingreso registrado. Una buena práctica es separar el 10-20% de tus ingresos para metas de ahorro.`
        ],
        intermedio: [
          `Ingreso de ${Utils.formatMoney(tx.amount)} en ${tx.category}. Evalúa si puedes aumentar tu tasa de ahorro este mes.`,
          `Buen registro. Considera crear una meta de ahorro con parte de este ingreso.`
        ],
        avanzado: [
          `Ingreso registrado. Analiza el origen (${tx.category}) y proyecta su recurrencia para mejorar tu flujo de caja.`,
          `Excelente. Cruza este ingreso con tus deudas activas para decidir si conviene abonar capital extra.`
        ]
      };
      const list = tips[level] || tips.basico;
      return list[Math.floor(Math.random() * list.length)];
    } else {
      const tips = {
        basico: [
          `Registraste un gasto de ${Utils.formatMoney(tx.amount)} en ${tx.category}. Revisa si estaba presupuestado.`,
          `Gasto anotado. Llevar el control de tus gastos es el primer paso para mejorar tus finanzas.`
        ],
        intermedio: [
          `Gasto de ${Utils.formatMoney(tx.amount)} en ${tx.category}. Compara este valor con meses anteriores para detectar patrones.`,
          `Movimiento registrado. Si esta categoría se repite mucho, considera fijar un límite mensual.`
        ],
        avanzado: [
          `Gasto en ${tx.category} por ${Utils.formatMoney(tx.amount)}. Evalúa el costo de oportunidad: ¿podría haberse destinado a reducir deuda o invertir?`,
          `Registro completo. Revisa tu balance neto después de este gasto para mantener la salud financiera de la simulación.`
        ]
      };
      const list = tips[level] || tips.basico;
      return list[Math.floor(Math.random() * list.length)];
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Transactions.init());
