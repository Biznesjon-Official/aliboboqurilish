/*
 Generate public/favicon.ico from an existing PNG (logo.png or logo192.png)
 Usage: npm run gen:favicon
*/
const fs = require('fs');
const path = require('path');
let pngToIco;
try {
  pngToIco = require('png-to-ico');
} catch (e) {
  console.warn('⚠️  Skipping favicon generation: "png-to-ico" is not installed (dev dependency).');
  process.exit(0); // Do not fail the build if png-to-ico is unavailable
}

(async () => {
  try {
    const publicDir = path.resolve(__dirname, '..', 'public');
    const candidates = ['alibobo-logo.png', 'alibobo.png', 'logo.png'];
    const src = candidates.map((f) => path.join(publicDir, f)).find((p) => fs.existsSync(p));
    if (!src) {
      console.error('❌ No source PNG found in /public (looked for alibobo-logo.png, alibobo.png, logo.png)');
      process.exit(1);
    }

    const out = path.join(publicDir, 'favicon.ico');
    const buf = await pngToIco(src);
    fs.writeFileSync(out, buf);
    console.log(`✅ Generated favicon.ico from ${path.basename(src)} at ${out}`);
  } catch (err) {
    console.error('❌ Failed to generate favicon.ico:', err.message);
    process.exit(1);
  }
})();
