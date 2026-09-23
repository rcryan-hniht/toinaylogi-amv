import { setTimeout as sleep } from 'node:timers/promises';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_HTML_BYTES = 2_000_000;
const MAX_IMAGE_BYTES = 4_000_000;
const allowedImageHosts = new Set([
  'ei.phncdn.com',
  'di.phncdn.com',
  'ci.phncdn.com',
  'bi.phncdn.com',
]);

export function safePhImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allowedImageHosts.has(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

async function request(url: string, maxBytes: number, expected: RegExp) {
  let last: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!expected.test(contentType))
        throw new Error(`Unexpected content type for ${url}`);
      const size = Number(response.headers.get('content-length') ?? '0');
      if (size > maxBytes) throw new Error(`Response too large for ${url}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > maxBytes)
        throw new Error(`Response too large for ${url}`);
      return { bytes, contentType };
    } catch (error) {
      last = error instanceof Error ? error : new Error(String(error));
      if (attempt < 2)
        await sleep(350 * (attempt + 1) + Math.floor(Math.random() * 200));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw last ?? new Error(`Request failed for ${url}`);
}

export async function fetchPornhubHtml(url: string) {
  const { bytes } = await request(url, MAX_HTML_BYTES, /^text\/html\b/i);
  await sleep(180);
  return new TextDecoder().decode(bytes);
}

export async function fetchPornhubImage(url: string) {
  const { bytes, contentType } = await request(
    url,
    MAX_IMAGE_BYTES,
    /^image\/(?:jpeg|png|webp|gif)\b/i,
  );
  await sleep(180);
  return { bytes, contentType };
}
