import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { config } from './config';
import { pool } from './db';
import { ApiError } from './lib/errors';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { fileRoutes } from './routes/files';
import { portalRoutes } from './routes/portal';
import { syncRoutes } from './routes/sync';

export async function buildApp(options: { logger?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
    trustProxy: true,
    bodyLimit: 6 * 1024 * 1024,
  });

  await app.register(cookie, { secret: config.SESSION_SECRET });
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
  await app.register(rateLimit, {
    max: 1200,
    timeWindow: '1 minute',
    // Static assets (images, models, JS/CSS) should never consume the API
    // budget. The trainer app loads hundreds of media files on a cold start.
    allowList: (request) => !request.url.startsWith('/api/'),
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: { code: 'too_many_requests', message: 'Too many requests' },
    }),
  });
  await app.register(multipart, {
    limits: {
      fileSize: config.MAX_FILE_MB * 1024 * 1024,
      files: 1,
    },
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({
      error: { code: 'not_found', message: 'Not found' },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    const statusCode = (error as { statusCode?: number }).statusCode;
    const code = (error as { code?: string }).code;
    if (statusCode === 429 || code === 'too_many_requests') {
      return reply.code(429).send({
        error: {
          code: 'too_many_requests',
          message: 'Too many requests',
        },
      });
    }
    if (code === 'FST_REQ_FILE_TOO_LARGE' || statusCode === 413) {
      return reply.code(413).send({
        error: {
          code: 'file_too_large',
          message: `File is larger than ${config.MAX_FILE_MB} MB`,
        },
      });
    }

    request.log.error(error);
    return reply.code(500).send({
      error: {
        code: 'internal_error',
        message: 'Internal server error',
      },
    });
  });

  app.addHook('onSend', async (request, reply, payload) => {
    if (!config.SERVE_STATIC) return payload;
    const path = request.url.split('?')[0];
    if (path === '/health' || path === '/manifest.json' || path === '/assets/manifest.json') {
      reply.header('Cache-Control', 'no-cache');
      return payload;
    }
    const contentType = String(reply.getHeader('content-type') || '');
    if (contentType.includes('text/html')) {
      reply.header('Cache-Control', 'no-store');
    } else if (contentType.includes('application/json') && !path.startsWith('/api/')) {
      reply.header('Cache-Control', 'public, max-age=86400');
    } else if (/\.(js|css|svg|png|webp|woff2?)$/i.test(path)) {
      reply.header('Cache-Control', 'public, max-age=86400');
    }
    return payload;
  });

  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return {
      ok: true,
      service: 'dkg-server',
      version: '0.1.0',
      time: new Date().toISOString(),
    };
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(syncRoutes, { prefix: '/api' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(portalRoutes, { prefix: '/api' });
  await app.register(fileRoutes, { prefix: '/api/files' });

  app.get('/', async (_request, reply) => {
    if (config.SERVE_STATIC) return reply.redirect('/fitness-crm.html');
    return {
      ok: true,
      service: 'David King Gym API',
      brand: 'David King Gym',
      attribution: 'Provided by David King Gym',
    };
  });

  // The legacy Firebase trainee portal is for old GitHub Pages links only.
  // On the server origin the personal portal is /p/<token>.
  app.get('/client.html', async (_request, reply) => reply.redirect('/fitness-crm.html'));

  /* The manifest in dist targets GitHub Pages (/David-King-Gym-Pro/...).
     On the server that start_url is a 404, so an installed home-screen icon
     would open a dead page. Serve a server-rooted manifest instead. */
  const serverManifest = {
    name: 'David King Gym',
    short_name: 'DK Gym',
    description: 'Fitness CRM — clients, training programs, nutrition',
    id: '/',
    start_url: '/fitness-crm.html',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    lang: 'ru',
    dir: 'ltr',
    categories: ['health', 'fitness', 'productivity'],
    icons: [
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    ],
  };
  for (const manifestPath of ['/manifest.json', '/assets/manifest.json']) {
    app.get(manifestPath, async (_request, reply) =>
      reply.header('Cache-Control', 'no-cache').type('application/json').send(serverManifest)
    );
  }

  for (const page of ['admin', 'join', 'reset', 'reset-app']) {
    app.get(`/${page}`, async (_request, reply) => {
      try {
        const html = readFileSync(join(__dirname, '..', 'public', `${page}.html`), 'utf8');
        return reply.type('text/html').send(html);
      } catch {
        throw new ApiError(404, 'not_found', `${page} page is not installed`);
      }
    });
  }

  // Personal trainee portal. The token is resolved by the API; the page itself
  // contains no tenant data.
  app.get('/p/:token', async (_request, reply) => {
    try {
      const html = readFileSync(join(__dirname, '..', 'public', 'portal.html'), 'utf8');
      reply.header('Cache-Control', 'no-store');
      return reply.type('text/html').send(html);
    } catch {
      throw new ApiError(404, 'not_found', 'Portal page is not installed');
    }
  });

  if (config.SERVE_STATIC) {
    await app.register(fastifyStatic, {
      root: resolve(config.STATIC_DIR),
      prefix: '/',
      index: false,
      // The exercise database is ~21 MB of JSON. Precompressed .br/.gz files
      // cut the phone's cold start to a few megabytes without per-request CPU.
      preCompressed: true,
      // Cache-Control is set in the onSend hook; the plugin default max-age=0
      // would otherwise make every phone start re-download the big database.
      cacheControl: false,
    });
  }

  return app;
}
