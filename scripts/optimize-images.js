/*
 Optimize header logos from public/logo.png to smaller sizes to reduce LCP cost.
 Usage: npm run assets:optimize
*/
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

(async () => {
  try {
    const publicDir = path.resolve(__dirname, '..', 'public');
    const src = path.join(publicDir, 'logo.png');
    if (!fs.existsSync(src)) {
      console.error('❌ Source PNG not found at public/logo.png');
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
