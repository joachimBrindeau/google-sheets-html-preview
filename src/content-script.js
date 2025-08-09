// Content script for Google Sheets cell detection - DRY & KISS refactored
// Integrates with Pell HTML Editor extension

// Utility functions (DRY principle)
const utils = {
  // Single function for sending messages (DRY)
  sendMessage(type, data) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type, data }).catch(error => {
        console.warn('Message send failed:', error);
      });
    }
  },

  // Single function for element validation (DRY)
  isCellElement(element) {
    if (!element || element.nodeType !== 1) return false;

    return element.getAttribute('role') === 'gridcell' ||
           element.classList.contains('waffle-cell') ||
           element.classList.contains('cell') ||
           (element.hasAttribute('data-row') && element.hasAttribute('data-col')) ||
           element.closest('[role="grid"]') !== null;
  },

  // Single function for coordinate conversion (DRY)
  toA1Notation(row, col) {
    let columnName = '';
    let tempCol = col;

    while (tempCol > 0) {
      tempCol--;
      columnName = String.fromCharCode(65 + (tempCol % 26)) + columnName;
      tempCol = Math.floor(tempCol / 26);
    }

    return columnName + row;
  },

  // Debounce utility (DRY)
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Simplified detector class (KISS principle)
class GoogleSheetsCellDetector {
  constructor() {
    this.currentSelection = null;
    this.observer = null;
    this.isInitialized = false;

    // Simplified detection with debouncing (KISS)
    this.detectCell = utils.debounce(() => this.findAndNotifySelection(), 150);
  }

  // Simplified initialization (KISS)
  init() {
    if (this.isInitialized) return;

    console.log('Initializing Google Sheets Cell Detector...');

    // Simple check for Google Sheets (KISS)
    const checkSheets = () => {
      const isSheets = document.querySelector('[role="grid"]') ||
                       document.querySelector('.waffle-cell');

      if (isSheets) {
        this.setupDetection();
        this.isInitialized = true;
        utils.sendMessage('SHEETS_DETECTOR_READY', { url: window.location.href });
        console.log('Google Sheets Cell Detector ready');
      } else {
        setTimeout(checkSheets, 1000);
      }
    };

    checkSheets();
  }

  // Simplified detection setup (KISS)
  setupDetection() {
    // Single observer for all changes (DRY)
    this.observer = new MutationObserver(() => this.detectCell());
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-selected', 'tabindex']
    });

    // Simple event listeners (DRY)
    ['click', 'keydown', 'focusin'].forEach(event => {
      document.addEventListener(event, () => this.detectCell());
    });

    // Initial detection
    setTimeout(() => this.detectCell(), 500);
  }

  // Simplified cell detection (KISS + DRY)
  findAndNotifySelection() {
    const cell = this.findSelectedCell();

    if (cell && this.hasSelectionChanged(cell)) {
      this.currentSelection = cell;
      utils.sendMessage('CELL_SELECTED', cell);
      console.log('Cell selected:', cell);
    }
  }

  // Single method to find selected cell (KISS)
  findSelectedCell() {
    // Simple selector list (DRY)
    const selectors = [
      '[role="gridcell"][aria-selected="true"]',
      '[role="gridcell"][tabindex="0"]',
      '.waffle-cell[tabindex="0"]',
      '.waffle-cell.selected'
    ];

    // Try each selector
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && utils.isCellElement(element)) {
        return this.extractCellInfo(element);
      }
    }

    // Fallback to focused element
    const focused = document.activeElement;
    if (utils.isCellElement(focused)) {
      return this.extractCellInfo(focused);
    }

    return null;
  }

  // Simplified cell info extraction (KISS + DRY)
  extractCellInfo(cellElement) {
    const coordinates = this.getCoordinates(cellElement);
    const content = cellElement.textContent?.trim() || '';
    const bounds = cellElement.getBoundingClientRect();

    return {
      content,
      coordinates,
      bounds: { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height },
      timestamp: Date.now(),
      url: window.location.href
    };
  }

  // Simplified coordinate extraction (KISS)
  getCoordinates(element) {
    // Try direct attributes first
    const row = element.getAttribute('data-row') || element.getAttribute('aria-rowindex');
    const col = element.getAttribute('data-col') || element.getAttribute('aria-colindex');

    // Try parent if not found
    if (!row || !col) {
      const parent = element.closest('[data-row][data-col]');
      if (parent) {
        const pRow = parent.getAttribute('data-row');
        const pCol = parent.getAttribute('data-col');
        if (pRow && pCol) {
          return { row: parseInt(pRow), col: parseInt(pCol), a1: utils.toA1Notation(parseInt(pRow), parseInt(pCol)) };
        }
      }
    }

    if (row && col) {
      const rowNum = parseInt(row);
      const colNum = parseInt(col);
      return { row: rowNum, col: colNum, a1: utils.toA1Notation(rowNum, colNum) };
    }

    return null;
  }

  // Simple comparison (KISS)
  hasSelectionChanged(newSelection) {
    return !this.currentSelection ||
           this.currentSelection.coordinates?.a1 !== newSelection.coordinates?.a1 ||
           this.currentSelection.content !== newSelection.content;
  }

  // Simple cleanup (KISS)
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

// Initialize the detector
const detector = new GoogleSheetsCellDetector();

// Start detection when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => detector.init());
} else {
  detector.init();
}

// Make detector available globally for debugging
window.sheetsCellDetector = detector;
