// Message types for Chrome extension communication
export const MESSAGE_TYPES = {
  // Storage operations
  SAVE_CONTENT: 'SAVE_CONTENT',
  LOAD_CONTENT: 'LOAD_CONTENT',
  RESET_CONTENT: 'RESET_CONTENT',
  
  // Google Sheets integration
  SHEETS_DETECTOR_READY: 'SHEETS_DETECTOR_READY',
  CELL_SELECTED: 'CELL_SELECTED',
  CELL_SELECTION_UPDATE: 'CELL_SELECTION_UPDATE',
  GET_CURRENT_CELL: 'GET_CURRENT_CELL',
  
  // UI commands
  KEYBOARD_COMMAND: 'KEYBOARD_COMMAND'
};

// Storage keys
export const STORAGE_KEYS = {
  EDITOR_CONTENT: 'editor-content',
  EDITOR_BACKUP: 'editor-backup',
  LAST_SAVED: 'last-saved',
  CURRENT_CELL_SELECTION: 'current-cell-selection',
  LAST_CELL_UPDATE: 'last-cell-update'
};
