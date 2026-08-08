/**
 * debts.js - Lógica del módulo de Gestión de Deudas
 */

const Debts = {
  init() {
    if (!Auth.requireAuth()) return;

    UI.applyTheme();
    Animations.init();
    UI.resetScroll();
    UI.initEduBanner();
    UI.renderNavbar('deudas');

    this.cacheDOM();
    this.bindEvents();
    this.renderAll();
    this.renderAIAssistant();
  },

  cacheDOM() {
    this.form = document.getElementById('debtForm');
    this.nameInput = document.getElementById('debtName');
    this.totalInput = document.getElementById('debtTotal');
    this.remainingInput = document.getElementById('debtRemaining');
    this.dueDateInput = document.getElementById('debtDueDate');
    this.interestInput = document.getElementById('debtInterest');
    this.listEl = document.getElementById('debtsList');
    this.totalEl = document.getElementById('deudaTotal');
  },

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreate();
      });
    }
  },

  handleCreate() {
    const name = this.nameInput.value.trim();
    const total = parseFloat(this.totalInput.value);
    const remaining = parseFloat(this.remainingInput.value);
    const dueDate = this.dueDateInput.value;
    const interest = parseFloat(this.interestInput.value) || 0;

    if (!name) {
      UI.showToast('Escribe el nombre o entidad de la deuda', 'error');
      this.nameInput.focus();
      return;
    }
    if (!total || total <= 0) {
      UI.showToast('Ingresa un monto total válido', 'error');
      return;
    }
    if (isNaN(remaining) || remaining < 0) {
      UI.showToast('Ingresa un saldo pendiente válido', 'error');
      return;
    }
    if (remaining > total) {
      UI.showToast('El saldo pendiente no puede ser mayor al monto total', 'error');
      return;
    }
    if (!dueDate) {
      UI.showToast('Selecciona la fecha de vencimiento', 'error');
      return;
    }

    const debt = {
      id: Utils.generateId(),
      name,
      total,
      remaining,
      dueDate,
      interest,
      createdAt: new Date().toISOString()
    };

    Storage.addDebt(debt);

    Storage.addNotification({
      id: Utils.generateId(),
      title: 'Nueva deuda registrada',
      message: `${name} – Saldo: ${Utils.formatMoney(remaining)}`,
      type: 'debt',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.form.reset();
    this.renderAll();
    UI.renderNavbar('deudas');
    UI.showToast('Deuda registrada correctamente', 'success');
    this.triggerAI('create', debt);
  },

  renderAll() {
    this.renderTotal();
    this.renderList();
  },

  renderTotal() {
    const debts = Storage.getDebts().filter(d => d.remaining > 0);
    const total = debts.reduce((sum, d) => sum + Number(d.remaining || 0), 0);
    if (this.totalEl) this.totalEl.textContent = Utils.formatMoney(total);
  },

  renderList() {
    if (!this.listEl) return;

    const debts = Storage.getDebts();

    if (debts.length === 0) {
      this.listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📉</div>
          <p>No tienes deudas registradas.</p>
          <p class="text-sm text-muted">Registra tu primera obligación usando el formulario.</p>
        </div>
      `;
      return;
    }

    this.listEl.innerHTML = debts.map(d => {
      const paid = d.total - d.remaining;
      const progress = d.total > 0 ? Math.min(Math.round((paid / d.total) * 100), 100) : 0;
      const isPaid = d.remaining <= 0;

      return `
        <div class="debt-card ${isPaid ? 'paid' : ''}" data-id="${d.id}">
          <div class="debt-card-header">
            <div>
              <div class="debt-name">${d.name}</div>
              <div class="debt-meta">
                <span class="text-sm text-muted">Vence: ${Utils.formatDate(d.dueDate)}</span>
                <span class="badge badge-info">${d.interest}% interés</span>
              </div>
            </div>
            <button class="debt-delete" onclick="Debts.confirmDelete('${d.id}')" title="Eliminar">🗑️</button>
          </div>

          <div class="debt-amounts">
            <div class="debt-amount-item">
              <span class="label">Monto inicial</span>
              <span class="value">${Utils.formatMoney(d.total)}</span>
            </div>
            <div class="debt-amount-item">
              <span class="label">Saldo pendiente</span>
              <span class="value ${isPaid ? 'text-success' : 'text-danger'}">${Utils.formatMoney(d.remaining)}</span>
            </div>
          </div>

          <div class="progress" style="height:10px;margin:0.75rem 0 0.4rem;">
            <div class="progress-bar" style="width:${progress}%; background:${isPaid ? '#219971' : '#EF4444'}"></div>
          </div>
          <div class="d-flex justify-between text-sm text-muted mb-2">
            <span>${progress}% pagado</span>
            <span>${isPaid ? '¡Deuda liquidada!' : `Pendiente: ${Utils.formatMoney(d.remaining)}`}</span>
          </div>

          ${!isPaid ? `
            <div class="debt-actions">
              <button class="btn btn-sm" onclick="Debts.openPayment('${d.id}')" style="background:#10B981; color:white; border:none;">
                 Abonar deuda
              </button>
              <button class="btn btn-outline btn-sm" onclick="Debts.showAmortization('${d.id}')">
                 Simular Amortización
              </button>
            </div>
          ` : `
            <div class="paid-badge">✅ Deuda pagada completamente</div>
          `}
        </div>
      `;
    }).join('');
  },

  openPayment(id) {
    const debts = Storage.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt || debt.remaining <= 0) return;

    UI.showModal({
      title: `Abonar a: ${debt.name}`,
      body: `
        <p class="text-sm text-muted mb-2">Saldo pendiente: <strong class="text-danger">${Utils.formatMoney(debt.remaining)}</strong></p>
        <div class="form-group">
          <label class="form-label">Monto del abono ($)</label>
          <input type="number" id="paymentAmount" class="form-control" placeholder="0" min="1" max="${debt.remaining}" step="1">
        </div>
      `,
      confirmText: 'Registrar Abono',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const input = document.getElementById('paymentAmount');
        const amount = parseFloat(input?.value);
        if (!amount || amount <= 0) {
          UI.showToast('Ingresa un monto válido', 'error');
          return;
        }
        if (amount > debt.remaining) {
          UI.showToast('El abono no puede superar el saldo pendiente', 'error');
          return;
        }
        this.makePayment(id, amount);
      }
    });

    setTimeout(() => {
      const input = document.getElementById('paymentAmount');
      if (input) input.focus();
    }, 100);
  },

  makePayment(id, amount) {
    const debts = Storage.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const newRemaining = Math.max(debt.remaining - amount, 0);
    const isPaid = newRemaining <= 0;

    Storage.updateDebt(id, { remaining: newRemaining });

    Storage.addNotification({
      id: Utils.generateId(),
      title: isPaid ? '¡Deuda liquidada!' : 'Abono registrado',
      message: isPaid
        ? `Has pagado completamente "${debt.name}"`
        : `Abono de ${Utils.formatMoney(amount)} a "${debt.name}"`,
      type: 'debt',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.renderAll();
    UI.renderNavbar('deudas');
    UI.showToast(isPaid ? '🎉 ¡Deuda pagada completamente!' : 'Abono registrado', 'success');
    this.triggerAI(isPaid ? 'complete' : 'payment', { ...debt, remaining: newRemaining, amount });
  },

  showAmortization(id) {
    const debts = Storage.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const principal = debt.remaining;
    const annualRate = debt.interest / 100;
    const monthlyRate = annualRate / 12;
    const months = 12;

    let balance = principal;
    let rows = '';
    let totalInterest = 0;

    const cuota = monthlyRate > 0
      ? principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : principal / months;

    for (let i = 1; i <= months; i++) {
      const interest = balance * monthlyRate;
      const capital = cuota - interest;
      balance = Math.max(balance - capital, 0);
      totalInterest += interest;

      rows += `
        <tr>
          <td>${i}</td>
          <td>${Utils.formatMoney(cuota)}</td>
          <td>${Utils.formatMoney(capital)}</td>
          <td>${Utils.formatMoney(interest)}</td>
          <td>${Utils.formatMoney(balance)}</td>
        </tr>
      `;
      if (balance <= 0) break;
    }

    UI.showModal({
      title: `Simulación de Amortización – ${debt.name}`,
      body: `
        <p class="text-sm text-muted mb-2">
          Saldo actual: <strong>${Utils.formatMoney(principal)}</strong> · 
          Tasa: <strong>${debt.interest}% anual</strong> · 
          Simulación a <strong>12 meses</strong>
        </p>
        <div class="table-wrapper" style="max-height:320px;overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cuota</th>
                <th>Capital</th>
                <th>Interés</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <p class="text-sm mt-2">
          Interés total estimado: <strong class="text-danger">${Utils.formatMoney(totalInterest)}</strong>
        </p>
      `,
      confirmText: 'Cerrar',
      cancelText: '',
      onConfirm: () => {}
    });
  },

  confirmDelete(id) {
    const debts = Storage.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    UI.showModal({
      title: 'Eliminar deuda',
      body: `<p>¿Seguro que deseas eliminar la deuda <strong>"${debt.name}"</strong>?</p>`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => this.deleteDebt(id)
    });
  },

  deleteDebt(id) {
    const debts = Storage.getDebts();
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    Storage.deleteDebt(id);

    Storage.addNotification({
      id: Utils.generateId(),
      title: 'Deuda eliminada',
      message: `"${debt.name}" fue eliminada`,
      type: 'debt',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.renderAll();
    UI.renderNavbar('deudas');
    UI.showToast('Deuda eliminada', 'success');
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
        <div class="ai-message">Estoy aquí para acompañarte durante toda tu simulación financiera.</div>
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
          `Deuda "${data.name}" registrada. Conocer tus obligaciones es el primer paso para controlarlas.`,
          `Nueva deuda anotada. Revisa la fecha de vencimiento para no generar intereses de mora.`
        ],
        intermedio: [
          `Deuda creada con ${data.interest}% de interés. Prioriza pagar primero las de mayor tasa.`,
          `Registro exitoso. Calcula cuánto puedes abonar extra cada mes para reducir el capital más rápido.`
        ],
        avanzado: [
          `Obligación registrada. Evalúa el costo real del interés compuesto a lo largo del tiempo.`,
          `Deuda ingresada. Considera si conviene unificar deudas o negociar una mejor tasa.`
        ]
      },
      payment: {
        basico: [
          `Abono de ${Utils.formatMoney(data.amount)} registrado. ¡Cada pago cuenta!`,
          `Buen avance. Sigue abonando de forma constante para liberarte más rápido.`
        ],
        intermedio: [
          `Abono realizado. Has reducido el capital de "${data.name}". El interés futuro también bajará.`,
          `Pago registrado. Revisa si puedes aumentar el abono el próximo mes.`
        ],
        avanzado: [
          `Capital reducido. Este abono disminuye el interés total que pagarás a largo plazo.`,
          `Movimiento correcto. Mantén un registro del porcentaje de deuda que has eliminado.`
        ]
      },
      complete: {
        basico: [
          `🎉 ¡Felicidades! Liquidaste completamente la deuda "${data.name}".`,
          `¡Deuda pagada! Este es un gran logro en tu simulación financiera.`
        ],
        intermedio: [
          `Deuda liquidada. Ahora puedes redirigir ese dinero hacia tus metas de ahorro.`,
          `¡Objetivo cumplido! Usa este impulso para atacar la siguiente deuda de mayor interés.`
        ],
        avanzado: [
          `Obligación extinguida. Analiza el tiempo y el costo total que te tomó para mejorar futuras decisiones.`,
          `Deuda cerrada con éxito. Considera crear un fondo de emergencia para evitar nuevas deudas.`
        ]
      }
    };

    const list = tips[action]?.[level] || tips[action]?.basico || ['Acción registrada correctamente.'];
    return list[Math.floor(Math.random() * list.length)];
  }
};

document.addEventListener('DOMContentLoaded', () => Debts.init());
