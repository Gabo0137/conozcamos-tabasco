import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public');
const extensions = new Set(['.html', '.css', '.js', '.glb', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.mp4', '.mpeg', '.mp3', '.wav', '.ogg', '.vtt', '.woff', '.woff2']);
await mkdir(output, { recursive: true });
let count = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile() || !extensions.has(extname(entry.name).toLowerCase())) continue;
  await copyFile(join(root, entry.name), join(output, entry.name));
  count++;
}
async function copyDirectory(relativeDirectory) {
  const source = join(root, relativeDirectory);
  const target = join(output, relativeDirectory);
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(join(relativeDirectory, entry.name));
    } else if (extensions.has(extname(entry.name).toLowerCase())) {
      await copyFile(sourcePath, targetPath);
      count++;
    }
  }
}
await copyDirectory('Valceo');
console.log(`Sitio preparado: ${count} archivos públicos.`);
