/**
 * main.js - Lógica del Tablero Principal (Dashboard)
 */

const Dashboard = {
  init() {
    if (!Auth.requireAuth()) return;

    UI.applyTheme();
    Animations.init();
    UI.resetScroll();
    UI.initEduBanner();
    UI.renderNavbar('dashboard');

    this.renderGreeting();
    this.renderMetrics();
    this.renderRecentTransactions();
    this.renderDebtsSummary();
    this.renderGoalsSummary();

    // Re-renderizar al cambiar de moneda
    document.addEventListener('currencyChanged', () => {
      this.renderMetrics();
      this.renderRecentTransactions();
      this.renderDebtsSummary();
      this.renderGoalsSummary();
    });
  },

  renderGreeting() {
    const user = Auth.getCurrentUser();
    const el = document.getElementById('greeting');
    if (!el || !user) return;
    const firstName = user.fullName.split(' ')[0];
    el.innerHTML = `¡Hola, ${firstName}! 👋`;
  },

  renderMetrics() {
    const txs = Storage.getTransactions();
    const goals = Storage.getGoals();
    const debts = Storage.getDebts();

    let ingresos = 0;
    let gastos = 0;
    txs.forEach(t => {
      if (t.type === 'ingreso') ingresos += Number(t.amount);
      else gastos += Number(t.amount);
    });
    const balance = ingresos - gastos;
    const ahorroTotal = goals.reduce((sum, g) => sum + Number(g.current || 0), 0);
    const deudaTotal = debts.reduce((sum, d) => sum + Number(d.remaining || 0), 0);

    let progresoMeta = 0;
    if (goals.length > 0) {
      const totalProgress = goals.reduce((sum, g) => {
        const p = g.target > 0 ? (g.current / g.target) * 100 : 0;
        return sum + Math.min(p, 100);
      }, 0);
      progresoMeta = Math.round(totalProgress / goals.length);
    }

    const set = (id, value, className = '') => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value;
      el.classList.remove('positive', 'negative');
      if (className) el.classList.add(className);
    };

    set('metricBalance', Utils.formatMoney(balance), balance >= 0 ? 'positive' : 'negative');
    set('metricAhorro', Utils.formatMoney(ahorroTotal), 'positive');
    set('metricDeuda', Utils.formatMoney(deudaTotal), deudaTotal > 0 ? 'negative' : '');

    const progressEl = document.getElementById('metricProgreso');
    const barEl = document.getElementById('metricProgresoBar');
    if (progressEl) progressEl.textContent = progresoMeta + '%';
    if (barEl) barEl.style.width = progresoMeta + '%';
  },

  renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    const txs = Storage.getTransactions().slice(0, 5);

    if (txs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💳</div>
          <p>Aún no hay transacciones registradas.</p>
          <a href="transacciones.html" class="btn btn-primary btn-sm mt-2">Registrar primera transacción</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th style="text-align:right">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${txs.map(t => `
              <tr>
                <td>${Utils.formatDate(t.date)}</td>
                <td>${t.description || '—'}</td>
                <td>
                  <span class="badge ${t.type === 'ingreso' ? 'badge-success' : 'badge-danger'}">
                    ${t.type === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                  </span>
                </td>
                <td style="text-align:right;font-weight:600;color:${t.type === 'ingreso' ? 'var(--success)' : 'var(--danger)'}">
                  ${t.type === 'ingreso' ? '+' : '-'} ${Utils.formatMoney(t.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDebtsSummary() {
    const container = document.getElementById('debtsSummary');
    if (!container) return;

    const debts = Storage.getDebts().filter(d => d.remaining > 0).slice(0, 3);

    if (debts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:1.5rem">
          <p class="text-muted">No tienes deudas activas.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = debts.map(d => {
      const progress = d.total > 0 ? Math.round(((d.total - d.remaining) / d.total) * 100) : 0;
      return `
        <div style="padding:0.9rem 0;border-bottom:1px solid var(--border);">
          <div class="d-flex justify-between align-center mb-1">
            <span class="font-semibold">${d.name}</span>
            <span class="text-danger font-semibold">${Utils.formatMoney(d.remaining)}</span>
          </div>
          <div class="d-flex justify-between text-sm text-muted mb-1">
            <span>Progreso de pago</span>
            <span>${progress}%</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderGoalsSummary() {
    const container = document.getElementById('goalsSummary');
    if (!container) return;

    const goals = Storage.getGoals().slice(0, 3);

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:1.5rem">
          <p class="text-muted">No tienes metas de ahorro aún.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(g => {
      const progress = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0;
      const priorityColor = g.priority === 'alta' ? 'badge-danger' : g.priority === 'media' ? 'badge-warning' : 'badge-info';
      return `
        <div style="padding:0.9rem 0;border-bottom:1px solid var(--border);">
          <div class="d-flex justify-between align-center mb-1">
            <span class="font-semibold">${g.name}</span>
            <span class="badge ${priorityColor}">${g.priority}</span>
          </div>
          <div class="d-flex justify-between text-sm text-muted mb-1">
            <span>${Utils.formatMoney(g.current)} de ${Utils.formatMoney(g.target)}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => Dashboard.init());
