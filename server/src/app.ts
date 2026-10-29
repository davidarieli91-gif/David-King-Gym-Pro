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
    max: 600,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
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

  for (const page of ['admin', 'join']) {
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
      setHeaders(res, path) {
        if (path.endsWith('.html')) res.header('Cache-Control', 'no-store');
      },
    });
  }

  return app;
}
