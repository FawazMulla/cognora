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
  console.log(`[monolith-build] Copying ${webDistDir} -> ${apiPublicDir}`);
  copyDirSync(webDistDir, apiPublicDir);
  console.log(`[monolith-build] Successfully synced static frontend to API public directory.`);
} else {
  console.warn(`[monolith-build] Warning: ${webDistDir} does not exist yet. Run web build first.`);
}
