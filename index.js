import express from 'express';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const MAX_SIZE = 1920;

const ROOT = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──
const envLocalPath = join(ROOT, '.env.local');
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

// ── Config ──
const PORT = process.env.PORT || 37837;
const SEARXNG_URL = process.env.SEARXNG_URL || 'https://search.noemt.dev';

// ── App ──
const app = express();
app.use(express.json({ limit: '5mb' }));

// ─────────────────────────────────────────────────────────────
// Web search
// ─────────────────────────────────────────────────────────────
app.get('/api/search/web', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ results: [] });

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const pageno = Math.max(1, Number(req.query.pageno) || 1);
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      pageno: String(pageno),
    });

    const categories = req.query.categories;
    if (categories) params.set('categories', categories);
    
    // Add time_range and language params support
    const time_range = req.query.time_range;
    if (time_range) params.set('time_range', time_range);
    
    const language = req.query.language;
    if (language) params.set('language', language);

    const safesearch = req.query.safesearch;
    if (safesearch !== undefined) params.set('safesearch', safesearch);

    const response = await fetch(`${SEARXNG_URL}/search?${params}`);
    if (!response.ok) throw new Error(`SearXNG returned ${response.status}`);
    const data = await response.json();

    const results = (data.results || []).slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      engine: r.engine,
      engines: r.engines,
      category: r.category,
      thumbnail: r.thumbnail || null,
      publishedDate: r.publishedDate || null,
    }));

    res.json({
      query,
      results,
      total: data.number_of_results || results.length,
      suggestions: data.suggestions || [],
      infoboxes: data.infoboxes || [],
    });
  } catch (error) {
    console.error('web search error:', error);
    res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// ─────────────────────────────────────────────────────────────
// Image search
// ─────────────────────────────────────────────────────────────
app.get('/api/search/images', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ results: [] });

    const pageno = Math.max(1, Number(req.query.pageno) || 1);
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      categories: 'images',
      pageno: String(pageno),
    });

    const time_range = req.query.time_range;
    if (time_range) params.set('time_range', time_range);
    
    const language = req.query.language;
    if (language) params.set('language', language);

    const safesearch = req.query.safesearch;
    if (safesearch !== undefined) params.set('safesearch', safesearch);

    const response = await fetch(`${SEARXNG_URL}/search?${params}`);
    if (!response.ok) throw new Error(`SearXNG returned ${response.status}`);
    const data = await response.json();

    const results = (data.results || [])
      .filter((r) => r.img_src || r.thumbnail)
      .map((r) => ({
        title: r.title,
        url: r.url,
        img_src: r.img_src || null,
        thumbnail: r.thumbnail || r.img_src || null,
        source: r.engine,
        resolution: r.resolution || null,
        img_format: r.img_format || null,
      }));

    res.json({
      query,
      results,
      total: data.number_of_results || results.length,
    });
  } catch (error) {
    console.error('image search error:', error);
    res.status(500).json({ error: 'Image search failed', results: [] });
  }
});

// ─────────────────────────────────────────────────────────────
// Image proxy — aggressive caching, single origin
// ─────────────────────────────────────────────────────────────
app.get('/api/proxy/image', async (req, res) => {
  const url = typeof req.query.url === 'string' ? req.query.url : '';
  const sizeParam = parseInt(req.query.size ?? '', 10);
  const size = Number.isFinite(sizeParam) && sizeParam > 0
    ? Math.min(sizeParam, MAX_SIZE)
    : null;

  if (!url) return res.status(400).end();

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).end();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LucidaImageProxy/1.0)',
        Accept: 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) return res.status(response.status).end();

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    if (
      !contentType.startsWith('image/') &&
      !contentType.startsWith('application/octet-stream')
    ) {
      return res.status(400).end();
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    const transformer = sharp(buffer);

    if (size) {
      transformer.resize({
        width: size,
        height: size,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    transformer.webp({ quality: 82 });

    const output = await transformer.toBuffer();

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', output.byteLength);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(output);

  } catch (err) {
    if (!res.headersSent) res.status(502).end();
  }
});

// ─────────────────────────────────────────────────────────────
// Favicon proxy — keeps everything on one origin
// ─────────────────────────────────────────────────────────────
app.get('/api/proxy/favicon', async (req, res) => {
  const domain = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
  const sz = Math.min(Math.max(Number(req.query.sz) || 32, 16), 128);
  if (!domain || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return res.status(400).end();
  }

  const target = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(target, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LucidaFaviconProxy/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) return res.status(response.status).end();

    const contentType = response.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch {
    if (!res.headersSent) res.status(502).end();
  }
});

// ─────────────────────────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────────────────────────
app.get('/api/suggest', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json({ suggestions: [] });
    const params = new URLSearchParams({ q: query, format: 'json' });
    const response = await fetch(`${SEARXNG_URL}/autocompleter?${params}`);
    if (!response.ok) return res.json({ suggestions: [] });
    const data = await response.json();
    res.json({ suggestions: data[1] || [] });
  } catch {
    res.json({ suggestions: [] });
  }
});

// ─────────────────────────────────────────────────────────────
// Static
// ─────────────────────────────────────────────────────────────
const distDir = join(ROOT, 'dist');
app.use(express.static(distDir, { maxAge: '1h' }));
app.use((_req, res) => {
  const indexPath = join(distDir, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res
      .status(200)
      .send(
        `<!doctype html><html><body><h1>Search</h1><p>Run <code>npm run build</code> first, or use <code>npm run dev</code> for development.</p></body></html>`,
      );
  }
});

app.listen(PORT, () => {
  console.log(`Search running on http://localhost:${PORT}`);
});