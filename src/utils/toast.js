// Toast notification utility
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Find or create toast container
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  // Show toast notification
  show(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    const toast = this.createToast(id, message, type);
    
    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast--show');
    });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  // Hide specific toast
  hide(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.add('toast--hide');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 300);
  }

  // Create toast element
  createToast(id, message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.dataset.id = id;

    const icon = this.getIcon(type);
    
    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__icon">${icon}</span>
        <span class="toast__message">${message}</span>
      </div>
      <button class="toast__close" onclick="toastManager.hide(${id})">×</button>
    `;

    return toast;
  }

  // Get icon for toast type
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  // Convenience methods
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  // Clear all toasts
  clear() {
    this.toasts.forEach((toast, id) => {
      this.hide(id);
    });
  }
}

// Create global instance
window.toastManager = new ToastManager();
