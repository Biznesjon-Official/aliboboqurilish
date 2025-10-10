/*
 Optimize header logos from public/alibobo-logo.png to smaller sizes to reduce LCP cost.
 Usage: npm run assets:optimize
*/
const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('⚠️  Sharp not installed. Falling back to copying alibobo-logo.png to logo-32.png and logo-48.png.');
  try {
    const publicDir = require('path').resolve(__dirname, '..', 'public');
    const fs = require('fs');
    const src = require('path').join(publicDir, 'alibobo-logo.png');
    if (fs.existsSync(src)) {
      for (const name of ['logo-32.png', 'logo-48.png']) {
        const dest = require('path').join(publicDir, name);
        fs.copyFileSync(src, dest);
        console.log(`✅ Fallback: copied ${require('path').basename(src)} → ${name}`);
      }
    } else {
      console.warn('⚠️  Fallback skipped: public/alibobo-logo.png not found');
    }
  } catch (err) {
    console.warn('⚠️  Fallback copy failed:', err.message);
  }
  process.exit(0); // Continue build
}

(async () => {
  try {
    const publicDir = path.resolve(__dirname, '..', 'public');
    const src = path.join(publicDir, 'alibobo-logo.png');
    if (!fs.existsSync(src)) {
      console.error('❌ Source PNG not found at public/alibobo-logo.png');
      process.exit(1);
    }

    const targets = [
      { out: path.join(publicDir, 'logo-32.png'), width: 32, height: 32 },
      { out: path.join(publicDir, 'logo-48.png'), width: 48, height: 48 },
    ];

    for (const t of targets) {
      await sharp(src)
        .resize(t.width, t.height, { fit: 'cover' })
        .png({ compressionLevel: 9, palette: true, quality: 80 })
        .toFile(t.out);
      console.log(`✅ Wrote ${path.basename(t.out)} (${t.width}x${t.height})`);
    }

    console.log('✅ Image optimization complete');
  } catch (err) {
    console.error('❌ Failed to optimize images:', err.message);
    process.exit(1);
  }
})();
