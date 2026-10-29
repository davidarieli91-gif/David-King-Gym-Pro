import { FastifyReply, FastifyRequest } from 'fastify';
import { getSession, SESSION_COOKIE, type AuthContext } from './sessions';
import { errors } from '../lib/errors';
import { safeEqualHex, sha256 } from '../lib/tokens';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export async function authenticate(request: FastifyRequest): Promise<void> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) throw errors.unauthorized();

  const context = await getSession(token);
  if (!context) throw errors.unauthorized();

  request.auth = context;
}

export async function requireDirector(request: FastifyRequest): Promise<void> {
  if (request.auth?.user.role !== 'director') {
    throw errors.forbidden('Director access required');
  }
}

/**
 * Double-submit CSRF check. The browser reads the non-HttpOnly cookie and
 * sends its value in X-CSRF-Token; the server compares its hash with the hash
 * stored in the session.
 */
export async function csrfProtection(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.auth) throw errors.unauthorized();
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

  const header = request.headers['x-csrf-token'];
  if (typeof header !== 'string' || !header) {
    throw errors.forbidden('Missing CSRF token');
  }

  if (!safeEqualHex(sha256(header), request.auth.csrfHash)) {
    throw errors.forbidden('Invalid CSRF token');
  }
}
