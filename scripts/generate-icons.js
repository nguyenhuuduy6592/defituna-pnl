const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    const inputFile = path.join(__dirname, '../public/favicon.svg');
    
    for (const size of sizes) {
      const outputFile = path.join(__dirname, `../public/icon-${size}x${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .toFile(outputFile);
      console.log(`Generated ${size}x${size} icon`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();