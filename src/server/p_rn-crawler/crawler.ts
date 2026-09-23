import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fetchPornhubHtml, fetchPornhubImage, safePhImageUrl } from './fetch';
import {
  parsePornstarProfile,
  parsePornhubVideo,
  type ParsedPornhubVideo,
} from './parser';
import type { Actress, Tier } from '@/lib/actresses';

export const PORNHUB_ORIGIN = 'https://www.pornhub.com';

const extensionFor = (contentType: string) =>
  contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

export const PORNHUB_SLUG_ALIASES: Readonly<Record<string, string>> = {
  'poly-yangs': 'polly-yangs',
  'charlie-o': 'charli-o',
  'stellar-cox': 'stella-cox',
};

export async function addPornhubActresses(
  slugs: string[],
  snapshotId: string,
  options: {
    imageDirectory?: string;
    tiers?: Readonly<Record<string, Tier>>;
  } = {},
): Promise<Actress[]> {
  const result: Actress[] = [];
  const imageDirectory =
    options.imageDirectory ??
    join(process.cwd(), 'public', 'actress-cache', 'snapshots', snapshotId, 'images');
  await mkdir(imageDirectory, { recursive: true });

  for (const slug of slugs) {
    const candidateSlugs = Array.from(
      new Set([slug, PORNHUB_SLUG_ALIASES[slug]].filter((s): s is string => Boolean(s))),
    );

    let profile;
    for (const candidate of candidateSlugs) {
      for (const prefix of ['pornstar', 'model'] as const) {
        const url = `${PORNHUB_ORIGIN}/${prefix}/${candidate}/`;
        try {
          const html = await fetchPornhubHtml(url);
          profile = parsePornstarProfile(html, url);
          if (profile) break;
        } catch {
          // Try next endpoint or candidate
        }
      }
      if (profile) break;
    }

    if (!profile) {
      console.error(`Failed to fetch or parse profile for ${slug}`);
      continue;
    }

    let imagePath = '';

    if (profile.imageUrl) {
      const safeUrl = safePhImageUrl(profile.imageUrl);
      if (safeUrl) {
        try {
          const download = await fetchPornhubImage(safeUrl.href);
          const ext = extensionFor(download.contentType);
          const filename = `${profile.id}.${ext}`;
          await writeFile(join(imageDirectory, filename), download.bytes);
          if (slug !== profile.id) {
            await writeFile(join(imageDirectory, `${slug}.${ext}`), download.bytes);
          }
          imagePath = `/actress-cache/snapshots/${snapshotId}/images/${filename}`;
        } catch (err) {
          console.error(`Failed to download image for ${profile.id}:`, err);
        }
      }
    }

    if (!imagePath) {
      console.error(`Skipping ${profile.id}: no usable local image`);
      continue;
    }

    const score = profile.ranks?.monthly
      ? Math.max(1, 550 - profile.ranks.monthly)
      : 100;
    const tier = options.tiers?.[profile.id] ?? options.tiers?.[slug] ?? 0;
    const bestRank =
      profile.ranks?.yearly ||
      profile.ranks?.monthly ||
      profile.ranks?.weekly ||
      100;

    result.push({
      id: profile.id,
      sourceUrl: profile.sourceUrl,
      name: profile.name,
      publicName: profile.name,
      aliases: [],
      heightCm: profile.heightCm,
      hometown: profile.hometown,
      debutYear: profile.debutYear,
      cup: profile.cup,
      imagePath,
      socialLinks: profile.socialLinks,
      score,
      tier,
      bestRank,
      appearances: 1,
      contributingMovies: [
        {
          rank: 1,
          code: `PH-${profile.id.toUpperCase()}`,
          movieUrl: `${PORNHUB_ORIGIN}/view_video.php?viewkey=ph${profile.id}`,
        }
      ]
    });
  }

  return result;
}

export async function fetchAndParsePornhubVideo(
  videoUrl: string,
): Promise<ParsedPornhubVideo> {
  const html = await fetchPornhubHtml(videoUrl);
  return parsePornhubVideo(html, videoUrl);
}
