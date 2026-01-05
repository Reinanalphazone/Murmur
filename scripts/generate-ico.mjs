import pngToIco from 'png-to-ico';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');

// Use the 256px icon to create the ICO file
const pngPath = join(iconsDir, '128x128@2x.png');
const icoPath = join(iconsDir, 'icon.ico');

try {
  const icoBuffer = await pngToIco(pngPath);
  await writeFile(icoPath, icoBuffer);
  console.log('Successfully created icon.ico');
} catch (error) {
  console.error('Failed to create ICO:', error);
}
