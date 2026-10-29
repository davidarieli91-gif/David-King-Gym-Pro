import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hmac(value: string): string {
  return createHmac('sha256', config.INVITE_PEPPER).update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function randomCode(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CROCKFORD[randomBytes(1)[0] % CROCKFORD.length];
  }
  return out;
}

export function inviteCode(): string {
  const code = randomCode(12);
  return `DKG-${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashInviteCode(code: string): string {
  return hmac(`invite:${normalizeInviteCode(code)}`);
}

export function hashPortalToken(token: string): string {
  return sha256(`portal:${token}`);
}

export function hashSessionToken(token: string): string {
  return sha256(`session:${token}`);
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

export function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
