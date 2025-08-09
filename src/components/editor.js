// Pell Editor Component
class EditorComponent {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.editor = null;
    this.isInitialized = false;
    this.content = '';
    this.onChangeCallback = null;
    this.debounceTimer = null;
  }

  // Initialize the editor
  async init() {
    try {
      this.container = document.getElementById(this.containerId);
      if (!this.container) {
        throw new Error(`Editor container '${this.containerId}' not found`);
      }

      // Check if Pell is available
      if (typeof pell === 'undefined') {
        throw new Error('Pell editor library not loaded');
      }

      // Initialize Pell editor
      this.editor = pell.init({
        element: this.container,
        onChange: (html) => this.handleChange(html),
        defaultParagraphSeparator: 'p',
        styleWithCSS: false,
        actions: [
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'heading1',
          'heading2',
          'paragraph',
          'quote',
          'olist',
          'ulist',
          'code',
          'line',
          'link',
          {
            name: 'image',
            icon: '📷',
            title: 'Insert Image',
            result: () => {
              const url = window.prompt('Enter image URL:');
              if (url) {
                pell.exec('insertImage', url);
              }
            }
          }
        ],
        classes: {
          actionbar: 'pell-actionbar',
          button: 'pell-button',
          content: 'pell-content',
          selected: 'pell-button-selected'
        }
      });

      this.isInitialized = true;
      console.log('Pell editor initialized successfully');
      
      // Load saved content
      await this.loadContent();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      this.showError('Failed to initialize editor: ' + error.message);
      throw error;
    }
  }

  // Handle content changes with performance optimization
  handleChange(html) {
    this.content = html;

    // Only trigger callback if content actually changed
    if (html === this.lastContent) {
      return;
    }
    this.lastContent = html;

    // Debounce the change callback for better performance
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Use shorter debounce for better responsiveness
    this.debounceTimer = setTimeout(() => {
      if (this.onChangeCallback) {
        this.onChangeCallback(html);
      }
    }, 150);
  }

  // Set change callback
  onChange(callback) {
    this.onChangeCallback = callback;
  }

  // Get current content
  getContent() {
    if (!this.isInitialized) return '';
    return this.editor.content.innerHTML;
  }

  // Set content
  setContent(html) {
    if (!this.isInitialized) {
      this.content = html;
      return;
    }
    
    this.editor.content.innerHTML = html;
    this.content = html;
  }

  // Load content from storage
  async loadContent() {
    try {
      if (!window.storageManager || !window.storageManager.isAvailable()) {
        console.warn('Storage manager not available');
        return;
      }

      const data = await window.storageManager.loadContent();
      if (data && data.content) {
        this.setContent(data.content);
        console.log('Content loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      this.showError('Failed to load saved content');
    }
  }

  // Save content to storage
  async saveContent() {
    try {
      if (!window.storageManager || !window.storageManager.isAvailable()) {
        throw new Error('Storage manager not available');
      }

      const content = this.getContent();
      const result = await window.storageManager.saveContent(content);
      
      console.log('Content saved successfully');
      this.showSuccess('Content saved successfully');
      
      return result;
    } catch (error) {
      console.error('Failed to save content:', error);
      this.showError('Failed to save content: ' + error.message);
      throw error;
    }
  }

  // Reset content to backup
  async resetContent() {
    try {
      if (!window.storageManager || !window.storageManager.isAvailable()) {
        throw new Error('Storage manager not available');
      }

      const result = await window.storageManager.resetContent();
      if (result && result.content) {
        this.setContent(result.content);
        console.log('Content reset to backup');
        this.showSuccess('Content reset to last saved version');
      }
      
      return result;
    } catch (error) {
      console.error('Failed to reset content:', error);
      this.showError('Failed to reset content: ' + error.message);
      throw error;
    }
  }

  // Focus the editor
  focus() {
    if (this.isInitialized && this.editor.content) {
      this.editor.content.focus();
    }
  }

  // Show success message
  showSuccess(message) {
    if (window.toastManager) {
      window.toastManager.success(message);
    }
  }

  // Show error message
  showError(message) {
    if (window.toastManager) {
      window.toastManager.error(message);
    }
  }

  // Cleanup
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.isInitialized = false;
    this.editor = null;
  }
}

// Export for global use
window.EditorComponent = EditorComponent;
