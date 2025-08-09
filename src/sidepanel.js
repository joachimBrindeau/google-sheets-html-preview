// Main Side Panel Application with Google Sheets Integration
class SidePanelApp {
  constructor() {
    this.editor = null;
    this.preview = null;
    this.isInitialized = false;
    this.loadingOverlay = null;
    this.statusIndicator = null;
    this.currentCellSelection = null;
    this.sheetsInfoElements = {};
  }

  // Initialize the application
  async init() {
    try {
      console.log('Initializing Side Panel App...');
      
      // Show loading overlay
      this.showLoading('Loading editor...');
      
      // Wait for DOM to be ready
      await this.waitForDOM();
      
      // Initialize components
      await this.initializeComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Hide loading overlay
      this.hideLoading();
      
      // Update status
      this.updateStatus('Ready', 'success');
      
      this.isInitialized = true;
      console.log('Side Panel App initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.hideLoading();
      this.updateStatus('Error: ' + error.message, 'error');
      this.showError('Failed to initialize application: ' + error.message);
    }
  }

  // Wait for DOM to be ready
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }

  // Initialize components
  async initializeComponents() {
    // Initialize editor
    this.editor = new EditorComponent('editor');
    await this.editor.init();
    
    // Initialize preview
    this.preview = new PreviewComponent('preview');
    this.preview.init();
    
    // Connect editor to preview
    this.editor.onChange((html) => {
      this.preview.updateContent(html);
    });
    
    // Get references to UI elements
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.statusIndicator = document.getElementById('status-text');

    // Google Sheets integration elements
    this.sheetsInfoElements = {
      container: document.getElementById('sheets-info'),
      currentCell: document.getElementById('current-cell'),
      contentPreview: document.getElementById('cell-content-preview')
    };

    // Load current cell selection if available
    this.loadCurrentCellSelection();
  }

  // Set up event listeners
  setupEventListeners() {
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.handleSave());
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }

    // Load cell button
    const loadCellBtn = document.getElementById('load-cell-btn');
    if (loadCellBtn) {
      loadCellBtn.addEventListener('click', () => this.handleLoadCell());
    }

    // Toggle preview button
    const toggleBtn = document.getElementById('toggle-preview');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.handleTogglePreview());
    }

    // Listen for messages from background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
      });
    }
  }

  // Set up keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        this.handleSave();
      }
      
      // Ctrl+R for reset
      if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        this.handleReset();
      }
    });
  }

  // DRY: Generic action handler
  async handleAction(actionName, actionFn, confirmMessage = null) {
    try {
      if (confirmMessage && !confirm(confirmMessage)) return;

      this.updateStatus(`${actionName}...`, 'loading');
      await actionFn();
      this.updateStatus(`${actionName} complete`, 'success');

      // Reset status after delay
      setTimeout(() => this.updateStatus('Ready', 'success'), 2000);
    } catch (error) {
      this.updateStatus(`${actionName} failed`, 'error');
      console.error(`${actionName} failed:`, error);
    }
  }

  // KISS: Simple wrapper methods
  async handleSave() {
    await this.handleAction('Saving', () => this.editor.saveContent());
  }

  async handleReset() {
    await this.handleAction(
      'Reset',
      () => this.editor.resetContent(),
      'Reset to last saved version? This will lose any unsaved changes.'
    );
  }

  // Handle toggle preview
  handleTogglePreview() {
    this.preview.toggle();
  }

  // Handle messages from background script
  handleMessage(message, sender, sendResponse) {
    console.log('Side panel received message:', message);

    switch (message.type) {
      case 'KEYBOARD_COMMAND':
        this.handleKeyboardCommand(message.command);
        break;

      case 'CELL_SELECTION_UPDATE':
        this.handleCellSelectionUpdate(message.data);
        break;
    }
  }

  // Load current cell selection from storage
  async loadCurrentCellSelection() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_CELL' }, (response) => {
          if (response && response.success && response.result) {
            this.handleCellSelectionUpdate(response.result);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load current cell selection:', error);
    }
  }

  // Handle cell selection updates from Google Sheets
  handleCellSelectionUpdate(cellData) {
    console.log('Received cell selection update:', cellData);

    this.currentCellSelection = cellData;
    this.updateSheetsInfo(cellData);

    // Optionally auto-load cell content into editor
    // this.loadCellContentIntoEditor(cellData);
  }

  // Update the Google Sheets info display
  updateSheetsInfo(cellData) {
    if (!this.sheetsInfoElements.currentCell) return;

    if (cellData && cellData.coordinates) {
      this.sheetsInfoElements.currentCell.textContent = cellData.coordinates.a1 || 'Unknown';

      if (this.sheetsInfoElements.contentPreview && cellData.content) {
        const preview = cellData.content.length > 30
          ? cellData.content.substring(0, 30) + '...'
          : cellData.content;
        this.sheetsInfoElements.contentPreview.textContent = preview ? `"${preview}"` : '(empty)';
      }

      // Show the sheets info container
      if (this.sheetsInfoElements.container) {
        this.sheetsInfoElements.container.style.display = 'block';
      }
    } else {
      this.sheetsInfoElements.currentCell.textContent = 'None';
      if (this.sheetsInfoElements.contentPreview) {
        this.sheetsInfoElements.contentPreview.textContent = '';
      }
    }
  }

  // KISS: Simple cell loading
  async handleLoadCell() {
    if (!this.currentCellSelection) {
      this.showError('No cell selected in Google Sheets');
      return;
    }

    await this.handleAction('Loading cell', () => this.loadCellContentIntoEditor(this.currentCellSelection));
  }

  // Load cell content into the editor
  async loadCellContentIntoEditor(cellData) {
    if (!this.editor || !cellData) return;

    let content = cellData.content || '';

    // If the content looks like plain text, wrap it in basic HTML
    if (content && !content.includes('<')) {
      // Simple text - wrap in paragraph
      content = `<p>${content}</p>`;
    }

    // If content is empty, provide a template
    if (!content) {
      content = `<h3>Cell ${cellData.coordinates?.a1 || 'Unknown'}</h3>
<p>Edit this content and save it back to your workflow.</p>`;
    }

    this.editor.setContent(content);
    this.editor.focus();

    console.log('Loaded cell content into editor:', content);
  }

  // Handle keyboard commands from background
  handleKeyboardCommand(command) {
    switch (command) {
      case 'save-content':
        this.handleSave();
        break;
      case 'reset-content':
        this.handleReset();
        break;
    }
  }

  // Show loading overlay
  showLoading(message = 'Loading...') {
    if (this.loadingOverlay) {
      const loadingText = this.loadingOverlay.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = message;
      }
      this.loadingOverlay.style.display = 'flex';
    }
  }

  // Hide loading overlay
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = 'none';
    }
  }

  // Update status indicator
  updateStatus(text, type = 'info') {
    if (this.statusIndicator) {
      this.statusIndicator.textContent = text;
      
      const statusDot = document.querySelector('.status-dot');
      if (statusDot) {
        statusDot.className = `status-dot status-dot--${type}`;
      }
    }
  }

  // Show error message
  showError(message) {
    if (window.toastManager) {
      window.toastManager.error(message);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SidePanelApp();
  window.app.init();
});
