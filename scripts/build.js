const fs = require('fs-extra');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const distDir = path.join(__dirname, '../dist');
const assetsDir = path.join(__dirname, '../assets');

async function build() {
  try {
    // Clean dist directory
    await fs.emptyDir(distDir);
    
    // Copy all source files
    await fs.copy(srcDir, distDir);
    
    // Copy assets
    if (await fs.pathExists(assetsDir)) {
      await fs.copy(assetsDir, path.join(distDir, 'assets'));
    }
    
    // Copy only essential Pell files to minimize bundle size
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    const pellPath = path.join(nodeModulesPath, 'pell');
    const pellDistPath = path.join(distDir, 'lib/pell');

    if (await fs.pathExists(pellPath)) {
      await fs.ensureDir(pellDistPath);

      // Copy only the dist folder (minified files)
      const pellSrcDist = path.join(pellPath, 'dist');
      if (await fs.pathExists(pellSrcDist)) {
        await fs.copy(pellSrcDist, path.join(pellDistPath, 'dist'));
      }

      // Copy package.json for reference
      const pellPackageJson = path.join(pellPath, 'package.json');
      if (await fs.pathExists(pellPackageJson)) {
        await fs.copy(pellPackageJson, path.join(pellDistPath, 'package.json'));
      }
    }
    
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
