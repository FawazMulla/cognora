import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const webDistDir = path.resolve(__dirname, '../apps/web/dist');
const apiPublicDir = path.resolve(__dirname, '../apps/api/public');

if (fs.existsSync(webDistDir)) {
  console.warn(`[monolith-build] Copying ${webDistDir} -> ${apiPublicDir}`);
  copyDirSync(webDistDir, apiPublicDir);

  // Rename index.html to _spa.html to prevent Next.js from treating it as a
  // special page during build (which causes <Html> document import errors).
  const srcHtml = path.join(apiPublicDir, 'index.html');
  const destHtml = path.join(apiPublicDir, '_spa.html');
  if (fs.existsSync(srcHtml)) {
    fs.renameSync(srcHtml, destHtml);
    console.warn(`[monolith-build] Renamed index.html -> _spa.html to avoid Next.js conflicts.`);
  }

  console.warn(`[monolith-build] Successfully synced static frontend to API public directory.`);
} else {
  console.warn(`[monolith-build] Warning: ${webDistDir} does not exist yet. Run web build first.`);
}
