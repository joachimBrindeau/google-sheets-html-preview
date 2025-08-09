const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const assetsDir = path.join(__dirname, '../assets');

console.log('🔍 Watching for changes...');

const watcher = chokidar.watch([srcDir, assetsDir], {
  ignored: /node_modules/,
  persistent: true
});

watcher.on('change', (filePath) => {
  console.log(`📝 File changed: ${filePath}`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('🔄 Rebuild completed');
  } catch (error) {
    console.error('❌ Rebuild failed:', error.message);
  }
});

watcher.on('add', (filePath) => {
  console.log(`➕ File added: ${filePath}`);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('🔄 Rebuild completed');
  } catch (error) {
    console.error('❌ Rebuild failed:', error.message);
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Stopping watcher...');
  watcher.close();
  process.exit(0);
});
