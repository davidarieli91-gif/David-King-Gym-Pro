import { pool } from '../db';

export interface AuditInput {
  tenantId?: string | null;
  actorUserId?: string | null;
  action: string;
  target?: string | null;
  meta?: unknown;
  ip?: string | null;
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (tenant_id, actor_user_id, action, target, meta, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.tenantId ?? null,
        input.actorUserId ?? null,
        input.action,
        input.target ?? null,
        JSON.stringify(input.meta ?? {}),
        input.ip ?? null,
      ],
    );
  } catch (error) {
    // Audit must never break a user-facing request.
    console.error('audit write failed', error);
  }
}
