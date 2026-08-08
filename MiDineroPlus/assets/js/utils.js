/**
 * utils.js - Utilidades globales de Mi Dinero+
 */

const Utils = {
  // ---------- Formateo de moneda ----------
  // Usa las tasas centralizadas de EXCHANGE_RATES (definidas en storage.js)
  get rates() {
    return typeof EXCHANGE_RATES !== 'undefined'
      ? EXCHANGE_RATES
      : { COP: 1, USD: 0.000238, EUR: 0.000217 };
  },

  formatMoney(amount, currency = null) {
    const settings = Storage.getSettings();
    const activeCurrency = settings.currency || 'COP';
    const targetCurrency = currency || activeCurrency;

    let value = Number(amount);
    // Si se pasa una moneda específica y es distinta de la moneda activa, convertimos al vuelo
    if (currency && currency !== activeCurrency) {
      const valInCOP = value / (this.rates[activeCurrency] || 1);
      value = valInCOP * (this.rates[targetCurrency] || 1);
    }

    const symbols = { COP: '$', USD: 'US$', EUR: '€' };
    const symbol = symbols[targetCurrency] || '$';

    // COP se muestra sin decimales, USD y EUR hasta con 2 decimales
    const maxDecimals = targetCurrency === 'COP' ? 0 : 2;

    return symbol + ' ' + value.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals
    });
  },

  // ---------- Formateo de fechas ----------
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // ---------- Validaciones ----------
  validateName(name) {
    if (!name || name.trim().length < 3) {
      return { valid: false, message: 'Ingresa al menos nombre y apellido' };
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) {
      return { valid: false, message: 'Debe incluir nombre y apellido' };
    }
    // Solo letras y espacios
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name)) {
      return { valid: false, message: 'Solo se permiten letras' };
    }
    // Cada palabra debe empezar con mayúscula
    const allCapitalized = parts.every(p => p[0] === p[0].toUpperCase());
    if (!allCapitalized) {
      return { valid: false, message: 'Cada palabra debe iniciar con mayúscula' };
    }
    return { valid: true, message: '' };
  },

  validateEmail(email) {
    if (!email) return { valid: false, message: 'El correo es obligatorio' };
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return { valid: false, message: 'Formato de correo inválido (ej: usuario@dominio.com)' };
    }
    return { valid: true, message: '' };
  },

  validatePassword(pass) {
    if (!pass) return { valid: false, message: 'La contraseña es obligatoria', strength: 0 };
    if (pass.length < 6 || pass.length > 10) {
      return { valid: false, message: 'Debe tener entre 6 y 10 caracteres', strength: 1 };
    }
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);

    if (!hasNumber || !hasSymbol) {
      return {
        valid: false,
        message: 'Debe incluir al menos un número y un símbolo especial',
        strength: hasNumber || hasSymbol ? 2 : 1
      };
    }
    return { valid: true, message: '', strength: 3 };
  },

  getPasswordStrength(pass) {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) score++;
    if (score <= 1) return 1;      // débil
    if (score <= 3) return 2;      // media
    return 3;                      // fuerte
  },

  // ---------- Helpers generales ----------
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Capitalizar nombre
  capitalizeName(name) {
    return name
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
};

// Exponer globalmente
window.Utils = Utils;
