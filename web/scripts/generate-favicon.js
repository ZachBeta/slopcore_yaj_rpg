const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure the public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Convert SVG to PNG
sharp(path.join(publicDir, 'favicon.svg'))
  .resize(32, 32)
  .toFile(path.join(publicDir, 'favicon.png'))
  .then(() => {
    console.log('PNG favicon generated successfully');
  })
  .catch(err => {
    console.error('Error generating PNG favicon:', err);
  }); 