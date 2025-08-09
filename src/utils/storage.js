// Storage utility for Chrome extension - DRY & KISS refactored
class StorageManager {
  constructor() {
    this.isExtensionContext = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  }

  // DRY: Single method for all message operations
  async sendMessage(type, content = null) {
    if (!this.isExtensionContext) {
      throw new Error('Not in extension context');
    }

    return new Promise((resolve, reject) => {
      const message = content ? { type, content } : { type };

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response?.success) {
          resolve(response.result);
        } else {
          reject(new Error(response?.error || `Failed to ${type.toLowerCase().replace('_', ' ')}`));
        }
      });
    });
  }

  // KISS: Simple wrapper methods
  async saveContent(content) {
    return this.sendMessage('SAVE_CONTENT', content);
  }

  async loadContent() {
    return this.sendMessage('LOAD_CONTENT');
  }

  async resetContent() {
    return this.sendMessage('RESET_CONTENT');
  }

  isAvailable() {
    return this.isExtensionContext;
  }
}

// Create global instance
window.storageManager = new StorageManager();
