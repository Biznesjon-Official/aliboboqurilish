#!/usr/bin/env node

// Enhanced bundle analysis script for Alibobo project
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Show usage information if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔍 Alibobo Bundle Analysis Tool');
  console.log('='.repeat(40));
  console.log('\nUsage: node scripts/analyze-bundle.js [options]');
  console.log('\nOptions:');
  console.log('  --analyze, -a     Auto-start webpack analyzer');
  console.log('  --skip-build, -s  Skip build step (use existing build)');
  console.log('  --stats-only      Show only bundle statistics');
  console.log('  --help, -h        Show this help message');
  console.log('\nExamples:');
  console.log('  npm run analyze:bundle');
  console.log('  node scripts/analyze-bundle.js --analyze');
  console.log('  node scripts/analyze-bundle.js --stats-only');
  process.exit(0);
}

console.log('🔍 Alibobo Bundle Analysis Tool');
console.log('='.repeat(40));

// Check if build directory exists
const buildDir = path.join(process.cwd(), 'build');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build directory not found. Running production build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Analyze bundle sizes
const analyzeBundle = () => {
  const staticDir = path.join(buildDir, 'static');

  if (!fs.existsSync(staticDir)) {
    console.log('❌ Static directory not found in build');
    return;
  }

  const jsDir = path.join(staticDir, 'js');
  const cssDir = path.join(staticDir, 'css');

  console.log('📦 Bundle Size Analysis:');
  console.log('========================\n');

  // Initialize size variables
  let totalJSSize = 0;
  let totalCSSSize = 0;

  // Analyze JavaScript bundles
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

    console.log('📄 JavaScript Bundles:');
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalJSSize += stats.size;

      let bundleType = 'Unknown';
      if (file.includes('main')) bundleType = 'Main Bundle';
      else if (file.includes('chunk')) bundleType = 'Code Split Chunk';
      else if (file.includes('runtime')) bundleType = 'Runtime';

      console.log(`  ${bundleType}: ${file} (${sizeKB} KB)`);
    });

    console.log(`  Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB\n`);
  }

  // Analyze CSS bundles
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

    console.log('🎨 CSS Bundles:');
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalCSSSize += stats.size;

      console.log(`  ${file} (${sizeKB} KB)`);
    });

    console.log(`  Total CSS Size: ${(totalCSSSize / 1024).toFixed(2)} KB\n`);
  }

  // Performance recommendations
  console.log('💡 Performance Recommendations:');
  console.log('================================');

  if (totalJSSize > 500 * 1024) {
    console.log('⚠️  JavaScript bundle is large (>500KB). Consider:');
    console.log('   - More aggressive code splitting');
    console.log('   - Tree shaking optimization');
    console.log('   - Removing unused dependencies');
  } else {
    console.log('✅ JavaScript bundle size is optimal');
  }

  if (totalCSSSize > 100 * 1024) {
    console.log('⚠️  CSS bundle is large (>100KB). Consider:');
    console.log('   - Purging unused Tailwind classes');
    console.log('   - Critical CSS extraction');
    console.log('   - CSS minification');
  } else {
    console.log('✅ CSS bundle size is optimal');
  }

  // Summary
  console.log('\n📊 Bundle Summary:');
  console.log(`   Total JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`);
  console.log(`   Total CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`);
  console.log(`   Total Bundle Size: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`);
};

// Enhanced webpack analyzer with better error handling
const runWebpackAnalyzer = async () => {
  return new Promise((resolve, reject) => {
    try {
      console.log('\n🔬 Starting webpack-bundle-analyzer...');
      console.log('📊 Opening interactive bundle analyzer at http://localhost:8888');
      console.log('💡 Press Ctrl+C to stop the analyzer\n');

      const analyzerProcess = spawn('npx', [
        'webpack-bundle-analyzer',
        'build/static/js/*.js',
        '--mode', 'server',
        '--host', 'localhost',
        '--port', '8888',
        '--open'
      ], {
        stdio: 'inherit',
        shell: true
      });

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping bundle analyzer...');
        analyzerProcess.kill();
        process.exit(0);
      });

      analyzerProcess.on('close', (code) => {
        console.log(`\nBundle analyzer exited with code ${code}`);
        resolve(code);
      });

      analyzerProcess.on('error', (error) => {
        console.log('ℹ️  webpack-bundle-analyzer not available. Install with:');
        console.log('   npm install --save-dev webpack-bundle-analyzer');
        resolve(1);
      });

    } catch (error) {
      console.log('ℹ️  webpack-bundle-analyzer not available. Install with:');
      console.log('   npm install --save-dev webpack-bundle-analyzer');
      resolve(1);
    }
  });
};

// Main execution with command line arguments support
async function main() {
  try {
    const args = process.argv.slice(2);
    const autoAnalyze = args.includes('--analyze') || args.includes('-a');
    const skipBuild = args.includes('--skip-build') || args.includes('-s');
    const statsOnly = args.includes('--stats-only');

    // Check if build exists
    if (!fs.existsSync(buildDir) && !skipBuild) {
      console.log('❌ Build directory not found. Running production build...\n');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('\n✅ Build completed successfully!\n');
      } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
      }
    } else if (!fs.existsSync(buildDir) && skipBuild) {
      console.log('❌ No build found and --skip-build flag used.');
      console.log('💡 Run without --skip-build or build manually with: npm run build');
      process.exit(1);
    }

    // Run basic analysis
    analyzeBundle();

    if (statsOnly) {
      console.log('\n📊 Stats-only mode. Exiting...');
      return;
    }

    if (autoAnalyze) {
      console.log('\n🚀 Auto-starting webpack analyzer...');
      await runWebpackAnalyzer();
    } else {
      // Ask user if they want to run detailed analysis
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\n🔬 Run detailed webpack analysis? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await runWebpackAnalyzer();
        } else {
          console.log('\n💡 Usage tips:');
          console.log('   • Run with --analyze to auto-start analyzer');
          console.log('   • Run with --skip-build to use existing build');
          console.log('   • Run with --stats-only for quick size check');
        }
        rl.close();
      });
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   • Make sure the project builds successfully');
    console.log('   • Install webpack-bundle-analyzer: npm install --save-dev webpack-bundle-analyzer');
    console.log('   • Check if build directory exists');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}