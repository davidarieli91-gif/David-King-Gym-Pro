import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { config } from '../config';

const ROOT = resolve(config.STORAGE_DIR);

function pathFor(key: string): string {
  const full = resolve(ROOT, key);
  if (full !== ROOT && !full.startsWith(ROOT + sep)) {
    throw new Error('Invalid storage key');
  }
  return full;
}

export async function saveStream(key: string, stream: Readable): Promise<{ size: number; sha256: string }> {
  const target = pathFor(key);
  await mkdir(dirname(target), { recursive: true });
  try {
    await pipeline(stream, createWriteStream(target));
    const info = await stat(target);
    const hash = createHash('sha256');
    await pipeline(createReadStream(target), hash);
    return { size: info.size, sha256: hash.digest('hex') };
  } catch (error) {
    await unlink(target).catch(() => undefined);
    throw error;
  }
}

export function readStream(key: string): Readable {
  return createReadStream(pathFor(key));
}

export async function deleteObject(key: string): Promise<void> {
  await unlink(pathFor(key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}
