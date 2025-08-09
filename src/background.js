// Background service worker for Pell HTML Editor Extension
import { MESSAGE_TYPES, STORAGE_KEYS } from './constants.js';

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Pell HTML Editor installed:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize default content on first install
    initializeDefaultContent();
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open side panel
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);

  try {
    // Find the active tab (MV3 onCommand doesn't pass tab)
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!activeTab || !activeTab.id) return;

    // Ensure side panel is open for the active tab
    await chrome.sidePanel.open({ tabId: activeTab.id });

    // Send command to side panel
    chrome.runtime.sendMessage({
      type: 'KEYBOARD_COMMAND',
      command,
      tabId: activeTab.id
    });
  } catch (error) {
    console.error('Failed to handle command:', error);
  }
});

// Handle messages from side panel and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'SAVE_CONTENT':
      handleSaveContent(message.content)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'LOAD_CONTENT':
      handleLoadContent()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'RESET_CONTENT':
      handleResetContent()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'SHEETS_DETECTOR_READY':
      handleSheetsDetectorReady(message.data, sender);
      break;

    case 'CELL_SELECTED':
      handleCellSelected(message.data, sender);
      break;

    case 'GET_CURRENT_CELL':
      sendResponse({ success: true, result: getCurrentCellSelection() });
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Initialize default content
async function initializeDefaultContent() {
  try {
    const defaultContent = `<h1>Welcome to Pell HTML Editor</h1>
<p>Start editing your HTML content here. Your changes will be saved automatically.</p>
<ul>
  <li>Use <strong>Ctrl+S</strong> to save</li>
  <li>Use <strong>Ctrl+R</strong> to reset</li>
  <li>See live preview on the right</li>
</ul>`;

    await chrome.storage.local.set({
      [STORAGE_KEYS.EDITOR_CONTENT]: defaultContent,
      [STORAGE_KEYS.EDITOR_BACKUP]: defaultContent,
      [STORAGE_KEYS.LAST_SAVED]: Date.now()
    });
    
    console.log('Default content initialized');
  } catch (error) {
    console.error('Failed to initialize default content:', error);
  }
}

// Handle save content
async function handleSaveContent(content) {
  try {
    const timestamp = Date.now();
    
    await chrome.storage.local.set({
      'editor-content': content,
      'editor-backup': content,
      'last-saved': timestamp
    });
    
    console.log('Content saved successfully');
    return { timestamp };
  } catch (error) {
    console.error('Failed to save content:', error);
    throw error;
  }
}

// Handle load content
async function handleLoadContent() {
  try {
    const result = await chrome.storage.local.get([
      'editor-content',
      'editor-backup',
      'last-saved'
    ]);
    
    return {
      content: result['editor-content'] || '',
      backup: result['editor-backup'] || '',
      lastSaved: result['last-saved'] || null
    };
  } catch (error) {
    console.error('Failed to load content:', error);
    throw error;
  }
}

// Handle reset content
async function handleResetContent() {
  try {
    const result = await chrome.storage.local.get(['editor-backup']);
    const backupContent = result['editor-backup'] || '';
    
    await chrome.storage.local.set({
      'editor-content': backupContent
    });
    
    console.log('Content reset to backup');
    return { content: backupContent };
  } catch (error) {
    console.error('Failed to reset content:', error);
    throw error;
  }
}

// Handle extension errors
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension suspending...');
});

// Google Sheets integration
let currentCellSelection = null;

// Handle Google Sheets detector ready
function handleSheetsDetectorReady(data, sender) {
  console.log('Google Sheets detector ready on tab:', sender.tab.id);

  // Update action badge to show integration is active
  chrome.action.setBadgeText({
    text: '📊',
    tabId: sender.tab.id
  });

  chrome.action.setBadgeBackgroundColor({
    color: '#34a853' // Google green
  });
}

// Handle cell selection from Google Sheets
function handleCellSelected(cellData, sender) {
  console.log('Cell selected in Google Sheets:', cellData);

  currentCellSelection = {
    ...cellData,
    tabId: sender.tab.id,
    timestamp: Date.now()
  };

  // Update badge with cell reference
  if (cellData.coordinates && cellData.coordinates.a1) {
    chrome.action.setBadgeText({
      text: cellData.coordinates.a1,
      tabId: sender.tab.id
    });
  }

  // Store the selected cell data
  chrome.storage.local.set({
    'current-cell-selection': currentCellSelection,
    'last-cell-update': Date.now()
  });

  // Notify side panel if open (ignore error if no listeners)
  chrome.runtime.sendMessage({
    type: 'CELL_SELECTION_UPDATE',
    data: currentCellSelection
  }, () => {
    // Accessing lastError prevents unchecked runtime.lastError warnings
    void chrome.runtime.lastError;
  });
}

// Get current cell selection
function getCurrentCellSelection() {
  return currentCellSelection;
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension starting up...');
});
