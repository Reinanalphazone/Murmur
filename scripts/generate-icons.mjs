import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const sourceImage = join(projectRoot, 'dist/assets/murmur_logo-no-words.png');
const iconsDir = join(projectRoot, 'src-tauri/icons');

// Ensure icons directory exists
await mkdir(iconsDir, { recursive: true });

// Get image dimensions
const metadata = await sharp(sourceImage).metadata();
console.log(`Source image: ${metadata.width}x${metadata.height}`);

// Make the image square by adding transparent padding
const maxDim = Math.max(metadata.width, metadata.height);
const squareImage = await sharp(sourceImage)
  .resize(maxDim, maxDim, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .toBuffer();

// Icon sizes needed for Tauri
const sizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
  // Windows Store logos
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 50 },
];

// Generate PNG icons
for (const icon of sizes) {
  await sharp(squareImage)
    .resize(icon.size, icon.size)
    .png()
    .toFile(join(iconsDir, icon.name));
  console.log(`Generated ${icon.name}`);
}

// Generate ICO file (Windows) - multiple sizes in one file
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(
  icoSizes.map(size =>
    sharp(squareImage)
      .resize(size, size)
      .png()
      .toBuffer()
  )
);

// For ICO, we'll just use the 256px version as the main icon
await sharp(squareImage)
  .resize(256, 256)
  .png()
  .toFile(join(iconsDir, 'icon.ico.png'));

console.log('Generated icon.ico.png (rename to icon.ico or use ico converter)');

// For ICNS (macOS), we need png2icns or similar tool
// For now just create the 512px and 1024px versions
await sharp(squareImage)
  .resize(512, 512)
  .png()
  .toFile(join(iconsDir, 'icon_512.png'));

await sharp(squareImage)
  .resize(1024, 1024)
  .png()
  .toFile(join(iconsDir, 'icon_1024.png'));

console.log('Generated macOS icon sources (use iconutil to create .icns)');
console.log('Done! Icons generated in src-tauri/icons/');
