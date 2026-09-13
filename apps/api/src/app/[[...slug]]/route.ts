import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params.slug || [];
  const publicDir = path.join(process.cwd(), 'public');

  // Check if a specific static file was requested (e.g., /assets/index-xxx.js)
  if (slug.length > 0) {
    const filePath = path.join(publicDir, ...slug);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  // Fallback to index.html for all SPA routes (e.g. /, /login, /viva, /syllabus, /exam-notes, etc.)
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Cognora</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>Cognora Unified Monolith</h2><p>Frontend assets are preparing. Please run build.</p></body></html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
