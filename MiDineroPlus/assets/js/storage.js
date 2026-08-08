/**
 * storage.js - Gestión central de estado y persistencia
 * Usa sessionStorage para datos de la sesión actual
 */

/**
 * Tasas de cambio centralizadas (base COP = 1).
 * 1 COP ≈ 0.000238 USD (≈ 4200 COP/USD)
 * 1 COP ≈ 0.000217 EUR (≈ 4600 COP/EUR)
 */
const EXCHANGE_RATES = {
  COP: 1,
  USD: 0.000238,
  EUR: 0.000217
};

const Storage = {
  KEYS: {
    USER: 'md_user',
    TRANSACTIONS: 'md_transactions',
    GOALS: 'md_goals',
    DEBTS: 'md_debts',
    NOTIFICATIONS: 'md_notifications',
    SETTINGS: 'md_settings',
    RATES: 'md_rates'
  },

  // ---------- Helpers internos ----------
  _get(key, fallback = null) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  _set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  _remove(key) {
    sessionStorage.removeItem(key);
  },

  // ---------- Usuario ----------
  getUser() {
    return this._get(this.KEYS.USER, null);
  },

  setUser(user) {
    this._set(this.KEYS.USER, user);
  },

  clearUser() {
    this._remove(this.KEYS.USER);
  },

  // ---------- Transacciones ----------
  getTransactions() {
    return this._get(this.KEYS.TRANSACTIONS, []);
  },

  saveTransactions(list) {
    this._set(this.KEYS.TRANSACTIONS, list);
  },

  addTransaction(tx) {
    const list = this.getTransactions();
    list.unshift(tx);
    this.saveTransactions(list);
    return tx;
  },

  deleteTransaction(id) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  },

  // ---------- Metas ----------
  getGoals() {
    return this._get(this.KEYS.GOALS, []);
  },

  saveGoals(list) {
    this._set(this.KEYS.GOALS, list);
  },

  addGoal(goal) {
    const list = this.getGoals();
    list.unshift(goal);
    this.saveGoals(list);
    return goal;
  },

  updateGoal(id, data) {
    const list = this.getGoals().map(g => g.id === id ? { ...g, ...data } : g);
    this.saveGoals(list);
  },

  deleteGoal(id) {
    const list = this.getGoals().filter(g => g.id !== id);
    this.saveGoals(list);
  },

  // ---------- Deudas ----------
  getDebts() {
    return this._get(this.KEYS.DEBTS, []);
  },

  saveDebts(list) {
    this._set(this.KEYS.DEBTS, list);
  },

  addDebt(debt) {
    const list = this.getDebts();
    list.unshift(debt);
    this.saveDebts(list);
    return debt;
  },

  updateDebt(id, data) {
    const list = this.getDebts().map(d => d.id === id ? { ...d, ...data } : d);
    this.saveDebts(list);
  },

  deleteDebt(id) {
    const list = this.getDebts().filter(d => d.id !== id);
    this.saveDebts(list);
  },

  // ---------- Notificaciones ----------
  getNotifications() {
    return this._get(this.KEYS.NOTIFICATIONS, []);
  },

  saveNotifications(list) {
    this._set(this.KEYS.NOTIFICATIONS, list);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift(notif);
    // Mantener máximo 50
    if (list.length > 50) list.length = 50;
    this.saveNotifications(list);
    return notif;
  },

  markNotificationsRead() {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    this.saveNotifications(list);
  },

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.read).length;
  },

  // ---------- Configuración ----------
  getSettings() {
    return this._get(this.KEYS.SETTINGS, {
      currency: 'COP',
      educationLevel: 'basico',
      aiEnabled: true,
      animations: true,
      theme: 'light'
    });
  },

  saveSettings(settings) {
    this._set(this.KEYS.SETTINGS, settings);
  },

  updateSetting(key, value) {
    const s = this.getSettings();
    s[key] = value;
    this.saveSettings(s);
    return s;
  },

  // ---------- Reiniciar simulación ----------
  resetSimulation() {
    this._remove(this.KEYS.TRANSACTIONS);
    this._remove(this.KEYS.GOALS);
    this._remove(this.KEYS.DEBTS);
    this._remove(this.KEYS.NOTIFICATIONS);
    // No borramos usuario ni settings
  },

  // ---------- Tasas de cambio (fallback) ----------
  getRates() {
    return this._get(this.KEYS.RATES, null);
  },

  saveRates(rates) {
    this._set(this.KEYS.RATES, rates);
  },

  // ---------- Conversión de Divisas ----------
  convertCurrency(oldCurrency, newCurrency) {
    if (oldCurrency === newCurrency) return;

    const rates = EXCHANGE_RATES;

    const convertValue = (val) => {
      const num = Number(val);
      if (isNaN(num)) return val;
      const valInCOP = num / (rates[oldCurrency] || 1);
      return valInCOP * (rates[newCurrency] || 1);
    };

    // 1. Convertir Transacciones
    const txs = this.getTransactions();
    const updatedTxs = txs.map(t => ({
      ...t,
      amount: convertValue(t.amount)
    }));
    this.saveTransactions(updatedTxs);

    // 2. Convertir Metas
    const goals = this.getGoals();
    const updatedGoals = goals.map(g => ({
      ...g,
      target: convertValue(g.target),
      current: convertValue(g.current)
    }));
    this.saveGoals(updatedGoals);

    // 3. Convertir Deudas
    const debts = this.getDebts();
    const updatedDebts = debts.map(d => ({
      ...d,
      total: convertValue(d.total),
      remaining: convertValue(d.remaining)
    }));
    this.saveDebts(updatedDebts);
  }
};

window.Storage = Storage;
