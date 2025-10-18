const fs = require('fs');
const { createCanvas } = require('canvas');

console.log('🎨 Creating simple adaptive logos...');

// Create logo for dark backgrounds (bright colors)
function createDarkBgLogo(size = 128) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background gradient (bright colors for dark backgrounds)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#4ecdc4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.15);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AB', size / 2, size / 2);

    return canvas;
}

// Create logo for light backgrounds (dark colors)
function createLightBgLogo(size = 128) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background gradient (dark colors for light backgrounds)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#34495e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.15);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AB', size / 2, size / 2);

    return canvas;
}

// Create text logo
function createTextLogo(isDark = true, width = 200, height = 60) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Transparent background
    ctx.clearRect(0, 0, width, height);

    // Text color based on background
    ctx.fillStyle = isDark ? 'white' : '#2c3e50';
    ctx.font = `bold ${height * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better visibility
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText('ALI BOBO', width / 2, height / 2);

    return canvas;
}

try {
    // Create logos
    const darkBgLogo = createDarkBgLogo(128);
    const lightBgLogo = createLightBgLogo(128);
    const darkBgText = createTextLogo(true, 200, 60);
    const lightBgText = createTextLogo(false, 200, 60);

    // Save logos
    fs.writeFileSync('public/logo.png', darkBgLogo.toBuffer('image/png'));
    fs.writeFileSync('public/white-mode-logo.png', lightBgLogo.toBuffer('image/png'));
    fs.writeFileSync('public/alibobo.png', darkBgText.toBuffer('image/png'));
    fs.writeFileSync('public/alibobo-white.png', lightBgText.toBuffer('image/png'));

    console.log('✅ Logos created successfully:');
    console.log('  - public/logo.png (navbar only - for dark backgrounds)');
    console.log('  - public/white-mode-logo.png (for light backgrounds)');
    console.log('  - public/alibobo.png (text logo for dark backgrounds)');
    console.log('  - public/alibobo-white.png (text logo for light backgrounds)');

} catch (error) {
    console.error('❌ Error creating logos:', error.message);
    console.log('💡 Install canvas package: npm install canvas');
    console.log('💡 Or use the HTML generator: create-adaptive-logos.html');
}

// Add roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}