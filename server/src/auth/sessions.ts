import { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config';
import { pool } from '../db';
import { hashSessionToken, randomToken, sha256 } from '../lib/tokens';

export const SESSION_COOKIE = 'dkg_session';
export const CSRF_COOKIE = 'dkg_csrf';

export interface AuthContext {
  sessionId: string;
  csrfHash: string;
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: 'director' | 'trainer';
    displayName: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    settings: Record<string, unknown>;
  };
}

interface SessionRow {
  session_id: string;
  csrf_hash: string;
  user_id: string;
  tenant_id: string;
  email: string;
  role: 'director' | 'trainer';
  user_name: string;
  user_status: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_status: string;
  settings: Record<string, unknown>;
}

export async function createSession(
  userId: string,
  request: FastifyRequest,
): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
  const token = randomToken(32);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + config.SESSION_DAYS * 86_400_000);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, csrf_hash, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      hashSessionToken(token),
      sha256(csrfToken),
      expiresAt,
      request.ip,
      request.headers['user-agent'] ?? null,
    ],
  );

  return { token, csrfToken, expiresAt };
}

export async function getSession(token: string): Promise<AuthContext | null> {
  const result = await pool.query<SessionRow>(
    `SELECT
       s.id AS session_id,
       s.csrf_hash,
       u.id AS user_id,
       u.tenant_id,
       u.email,
       u.role,
       u.display_name AS user_name,
       u.status AS user_status,
       t.display_name AS tenant_name,
       t.slug AS tenant_slug,
       t.status AS tenant_status,
       t.settings
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     JOIN tenants t ON t.id = u.tenant_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashSessionToken(token)],
  );

  const row = result.rows[0];
  if (!row) return null;
  if (row.user_status !== 'active' || row.tenant_status !== 'active') return null;

  // Best-effort activity tracking, at most once per hour.
  void pool
    .query(
      `UPDATE sessions SET last_seen_at = now()
       WHERE id = $1 AND last_seen_at < now() - interval '1 hour'`,
      [row.session_id],
    )
    .catch(() => undefined);

  return {
    sessionId: row.session_id,
    csrfHash: row.csrf_hash,
    user: {
      id: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      role: row.role,
      displayName: row.user_name,
    },
    tenant: {
      id: row.tenant_id,
      name: row.tenant_name,
      slug: row.tenant_slug,
      status: row.tenant_status,
      settings: row.settings ?? {},
    },
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function deleteUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  if (exceptSessionId) {
    await pool.query('DELETE FROM sessions WHERE user_id = $1 AND id <> $2', [userId, exceptSessionId]);
  } else {
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }
}

export function setAuthCookies(
  reply: FastifyReply,
  token: string,
  csrfToken: string,
  expiresAt: Date,
): void {
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    expires: expiresAt,
  });
  reply.setCookie(CSRF_COOKIE, csrfToken, {
    path: '/',
    httpOnly: false,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax',
    expires: expiresAt,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
  reply.clearCookie(CSRF_COOKIE, { path: '/' });
}
