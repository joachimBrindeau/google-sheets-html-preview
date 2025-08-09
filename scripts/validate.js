const fs = require('fs-extra');
const path = require('path');

async function validateExtension() {
  console.log('🔍 Validating extension...');
  
  const distDir = path.join(__dirname, '../dist');
  const errors = [];
  const warnings = [];
  
  try {
    // Check if dist directory exists
    if (!await fs.pathExists(distDir)) {
      errors.push('dist directory not found. Run "npm run build" first.');
      return { errors, warnings };
    }
    
    // Validate manifest.json
    const manifestPath = path.join(distDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      errors.push('manifest.json not found in dist directory');
    } else {
      const manifest = await fs.readJson(manifestPath);
      
      // Check required fields
      const requiredFields = ['manifest_version', 'name', 'version'];
      requiredFields.forEach(field => {
        if (!manifest[field]) {
          errors.push(`manifest.json missing required field: ${field}`);
        }
      });
      
      // Check manifest version
      if (manifest.manifest_version !== 3) {
        warnings.push('Using manifest version ' + manifest.manifest_version + ', consider upgrading to v3');
      }
      
      // Check permissions
      if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
        warnings.push('No permissions defined in manifest');
      }
      
      // Check icons
      if (manifest.icons) {
        for (const [size, iconPath] of Object.entries(manifest.icons)) {
          const fullIconPath = path.join(distDir, iconPath);
          if (!await fs.pathExists(fullIconPath)) {
            errors.push(`Icon not found: ${iconPath} (${size}px)`);
          }
        }
      }
    }
    
    // Check required files
    const requiredFiles = [
      'background.js',
      'sidepanel.html',
      'sidepanel.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(distDir, file);
      if (!await fs.pathExists(filePath)) {
        errors.push(`Required file not found: ${file}`);
      }
    }
    
    // Check CSS files
    const cssPath = path.join(distDir, 'styles/main.css');
    if (!await fs.pathExists(cssPath)) {
      warnings.push('Main CSS file not found: styles/main.css');
    }
    
    // Check Pell library
    const pellPath = path.join(distDir, 'lib/pell/dist');
    if (!await fs.pathExists(pellPath)) {
      errors.push('Pell library not found in lib/pell/dist');
    } else {
      const pellCss = path.join(pellPath, 'pell.min.css');
      const pellJs = path.join(pellPath, 'pell.min.js');
      
      if (!await fs.pathExists(pellCss)) {
        errors.push('Pell CSS not found: lib/pell/dist/pell.min.css');
      }
      
      if (!await fs.pathExists(pellJs)) {
        errors.push('Pell JS not found: lib/pell/dist/pell.min.js');
      }
    }
    
    // Check file sizes
    const stats = await fs.stat(distDir);
    const sizeLimit = 50 * 1024 * 1024; // 50MB limit for Chrome extensions
    
    if (stats.size > sizeLimit) {
      warnings.push(`Extension size (${Math.round(stats.size / 1024 / 1024)}MB) is large. Consider optimization.`);
    }
    
    // Validate HTML files
    const htmlFiles = ['sidepanel.html'];
    for (const htmlFile of htmlFiles) {
      const htmlPath = path.join(distDir, htmlFile);
      if (await fs.pathExists(htmlPath)) {
        const content = await fs.readFile(htmlPath, 'utf8');
        
        // Basic HTML validation
        if (!content.includes('<!DOCTYPE html>')) {
          warnings.push(`${htmlFile} missing DOCTYPE declaration`);
        }
        
        if (!content.includes('<html')) {
          errors.push(`${htmlFile} missing html tag`);
        }
        
        if (!content.includes('<head>') || !content.includes('<body>')) {
          errors.push(`${htmlFile} missing head or body tag`);
        }
      }
    }
    
  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
  }
  
  return { errors, warnings };
}

async function main() {
  const { errors, warnings } = await validateExtension();
  
  console.log('\n📊 Validation Results:');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log('\n💥 Validation failed!');
    process.exit(1);
  } else {
    console.log('\n✅ Validation passed!');
    
    if (warnings.length === 0) {
      console.log('🎉 No issues found!');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateExtension };
