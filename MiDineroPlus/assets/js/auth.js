/**
 * auth.js - Autenticación simulada
 */

const Auth = {
  isLoggedIn() {
    return !!Storage.getUser();
  },

  getCurrentUser() {
    return Storage.getUser();
  },

  register({ fullName, email, password }) {
    // Validaciones
    const nameCheck = Utils.validateName(fullName);
    if (!nameCheck.valid) return { success: false, message: nameCheck.message };

    const emailCheck = Utils.validateEmail(email);
    if (!emailCheck.valid) return { success: false, message: emailCheck.message };

    const passCheck = Utils.validatePassword(password);
    if (!passCheck.valid) return { success: false, message: passCheck.message };

    // Crear usuario simulado
    const user = {
      id: Utils.generateId(),
      fullName: Utils.capitalizeName(fullName.trim()),
      email: email.trim().toLowerCase(),
      password: password, // Solo para simulación
      role: 'Asesor Comercial',
      company: 'Meta Autos Medellín',
      createdAt: new Date().toISOString(),
      avatar: {
        type: 'initial',
        value: fullName.trim().charAt(0).toUpperCase(),
        color: '#0B1F3A'
      },
      progress: 0,
      level: 'Aprendiz Financiero'
    };

    Storage.setUser(user);

    // Inicializar datos vacíos
    if (!Storage.getTransactions().length) Storage.saveTransactions([]);
    if (!Storage.getGoals().length) Storage.saveGoals([]);
    if (!Storage.getDebts().length) Storage.saveDebts([]);
    if (!Storage.getNotifications().length) Storage.saveNotifications([]);

    return { success: true, user };
  },

  login({ fullName, email, password }) {
    const nameCheck = Utils.validateName(fullName);
    if (!nameCheck.valid) return { success: false, message: nameCheck.message };

    const emailCheck = Utils.validateEmail(email);
    if (!emailCheck.valid) return { success: false, message: emailCheck.message };

    const passCheck = Utils.validatePassword(password);
    if (!passCheck.valid) return { success: false, message: passCheck.message };

    // En esta simulación aceptamos cualquier dato válido
    // (no hay base de datos real)
    let user = Storage.getUser();

    if (!user || user.email !== email.trim().toLowerCase()) {
      // Crear usuario al vuelo si no existe
      user = {
        id: Utils.generateId(),
        fullName: Utils.capitalizeName(fullName.trim()),
        email: email.trim().toLowerCase(),
        password: password,
        role: 'Asesor Comercial',
        company: 'Meta Autos Medellín',
        createdAt: new Date().toISOString(),
        avatar: {
          type: 'initial',
          value: fullName.trim().charAt(0).toUpperCase(),
          color: '#0B1F3A'
        },
        progress: 33,
        level: 'Organizador Financiero'
      };
      Storage.setUser(user);
    }

    return { success: true, user };
  },

  logout() {
    Storage.clearUser();
    // Opcional: limpiar datos financieros al salir
    // Storage.resetSimulation();
    window.location.href = this._getLoginPath();
  },

  updateUser(data) {
    const user = Storage.getUser();
    if (!user) return null;
    const updated = { ...user, ...data };
    Storage.setUser(updated);
    return updated;
  },

  // Rutas según ubicación del archivo
  _getLoginPath() {
    const path = window.location.pathname;
    if (path.includes('/views/')) return 'login.html';
    return 'views/login.html';
  },

  _getDashboardPath() {
    const path = window.location.pathname;
    if (path.includes('/views/')) return 'dashboard.html';
    return 'views/dashboard.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = this._getLoginPath();
      return false;
    }
    return true;
  }
};

window.Auth = Auth;
