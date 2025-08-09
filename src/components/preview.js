// HTML Preview Component
class PreviewComponent {
  constructor(iframeId) {
    this.iframeId = iframeId;
    this.iframe = null;
    this.isVisible = true;
    this.updateTimer = null;
  }

  // Initialize the preview
  init() {
    try {
      this.iframe = document.getElementById(this.iframeId);
      if (!this.iframe) {
        throw new Error(`Preview iframe '${this.iframeId}' not found`);
      }

      // Set up iframe
      this.setupIframe();
      
      console.log('Preview component initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize preview:', error);
      throw error;
    }
  }

  // Set up iframe with basic HTML structure
  setupIframe() {
    const baseHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 16px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 0;
            margin-bottom: 16px;
        }
        p {
            margin-bottom: 16px;
        }
        ul, ol {
            margin-bottom: 16px;
            padding-left: 24px;
        }
        blockquote {
            margin: 16px 0;
            padding: 8px 16px;
            border-left: 4px solid #ddd;
            background: #f9f9f9;
        }
        code {
            background: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div id="content">
        <p>Preview will appear here...</p>
    </div>
</body>
</html>`;

    this.iframe.srcdoc = baseHTML;
  }

  // Update preview content
  updateContent(html) {
    if (!this.iframe) return;

    // Debounce updates
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      this.performUpdate(html);
    }, 150);
  }

  // Perform the actual update
  performUpdate(html) {
    try {
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      const contentDiv = iframeDoc.getElementById('content');
      
      if (contentDiv) {
        contentDiv.innerHTML = html || '<p><em>No content to preview</em></p>';
      }
    } catch (error) {
      console.error('Failed to update preview:', error);
    }
  }

  // Toggle preview visibility
  toggle() {
    if (!this.iframe) return;

    this.isVisible = !this.isVisible;
    this.iframe.style.display = this.isVisible ? 'block' : 'none';
    
    const toggleBtn = document.getElementById('toggle-preview');
    if (toggleBtn) {
      toggleBtn.textContent = this.isVisible ? 'Hide' : 'Show';
    }

    return this.isVisible;
  }

  // Show preview
  show() {
    if (!this.iframe) return;
    
    this.isVisible = true;
    this.iframe.style.display = 'block';
    
    const toggleBtn = document.getElementById('toggle-preview');
    if (toggleBtn) {
      toggleBtn.textContent = 'Hide';
    }
  }

  // Hide preview
  hide() {
    if (!this.iframe) return;
    
    this.isVisible = false;
    this.iframe.style.display = 'none';
    
    const toggleBtn = document.getElementById('toggle-preview');
    if (toggleBtn) {
      toggleBtn.textContent = 'Show';
    }
  }

  // Get current visibility state
  isShown() {
    return this.isVisible;
  }

  // Cleanup
  destroy() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
  }
}

// Export for global use
window.PreviewComponent = PreviewComponent;
