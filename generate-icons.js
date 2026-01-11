const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = './assets/images/logo.png';
const outputDir = './assets/images/icons';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
    console.log('Generating PWA icons...');
    
    for (const size of sizes) {
        const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
        
        try {
            await sharp(inputImage)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 10, g: 10, b: 15, alpha: 1 }
                })
                .png()
                .toFile(outputFile);
            
            console.log(`✓ Generated ${outputFile}`);
        } catch (error) {
            console.error(`✗ Error generating ${size}x${size}:`, error.message);
        }
    }
    
    // Also copy 512 as favicon
    try {
        await sharp(inputImage)
            .resize(32, 32)
            .png()
            .toFile('./favicon-32x32.png');
        console.log('✓ Generated favicon-32x32.png');
        
        await sharp(inputImage)
            .resize(16, 16)
            .png()
            .toFile('./favicon-16x16.png');
        console.log('✓ Generated favicon-16x16.png');
    } catch (error) {
        console.error('Error generating favicon:', error.message);
    }
    
    console.log('\nDone! Icons generated in', outputDir);
}

generateIcons();
