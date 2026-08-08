/**
 * animations.js - Control global de animaciones
 */

const Animations = {
  init() {
    const settings = Storage.getSettings();
    this.apply(settings.animations !== false);
  },

  apply(enabled) {
    if (enabled) {
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.classList.add('no-animations');
    }
  },

  toggle(enabled) {
    Storage.updateSetting('animations', enabled);
    this.apply(enabled);
  }
};

window.Animations = Animations;
