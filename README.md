# Pell HTML Editor for Google Sheets

A lean Chrome extension with Pell WYSIWYG editor integrated with Google Sheets cell detection.

## Features

- 🎨 **Pell WYSIWYG Editor**: Clean HTML editor with toolbar
- 👁️ **Live Preview**: Real-time HTML preview
- 📊 **Google Sheets Integration**: Detects selected cells automatically
- 🔄 **Cell Loading**: Load cell content into editor
- 💾 **Save/Reset**: Persistent storage
- ⌨️ **Shortcuts**: Ctrl+S (save), Ctrl+R (reset), Ctrl+Shift+Y (open)
- 🎯 **Side Panel**: Chrome side panel integration

## Quick Start

```bash
npm install
npm run build
```

Load `dist/` folder in Chrome extensions (Developer mode).

## Usage

1. Open Google Sheets and select a cell
2. Open side panel (Ctrl+Shift+Y or click extension icon)
3. Click "Load Cell" to import cell content
4. Edit with WYSIWYG editor
5. Save with Ctrl+S
