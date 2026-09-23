import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { fetchPornhubHtml, fetchPornhubImage, safePhImageUrl } from './fetch';
import { parsePornstarProfile } from './parser';
import type { Actress, Tier } from '@/lib/actresses';

export const PORNHUB_ORIGIN = 'https://www.pornhub.com';

const extensionFor = (contentType: string) =>
  contentType.includes('png')
    ? 'png'
    : contentType.includes('webp')
      ? 'webp'
      : 'jpg';

export async function addPornhubActresses(slugs: string[], snapshotId: string): Promise<Actress[]> {
  const result: Actress[] = [];
  
  for (const slug of slugs) {
    let html = '';
    let url = `${PORNHUB_ORIGIN}/pornstar/${slug}/`;
    
    try {
      html = await fetchPornhubHtml(url);
    } catch {
      url = `${PORNHUB_ORIGIN}/model/${slug}/`;
      try {
        html = await fetchPornhubHtml(url);
      } catch (err) {
        console.error(`Failed to fetch profile for ${slug}`);
        continue;
      }
    }
    
    const profile = parsePornstarProfile(html, url);
    let imagePath = '';
    
    if (profile.imageUrl) {
      const safeUrl = safePhImageUrl(profile.imageUrl);
      if (safeUrl) {
        try {
          const download = await fetchPornhubImage(safeUrl.href);
          const filename = `${profile.id}.${extensionFor(download.contentType)}`;
          const dir = join(process.cwd(), 'public', 'actress-cache', 'snapshots', snapshotId, 'images');
          await writeFile(join(dir, filename), download.bytes);
          imagePath = `/actress-cache/snapshots/${snapshotId}/images/${filename}`;
        } catch (err) {
          console.error(`Failed to download image for ${profile.id}:`, err);
        }
      }
    }
    
    const score = profile.ranks?.monthly ? Math.max(1, 550 - profile.ranks.monthly) : 100;
    const tier: Tier = 0; // Temporary, should be assigned properly
    const bestRank = profile.ranks?.yearly || profile.ranks?.monthly || profile.ranks?.weekly || 100;
    
    result.push({
      id: profile.id,
      sourceUrl: profile.sourceUrl,
      name: profile.name,
      publicName: '', // Temporary
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
          movieUrl: `${PORNHUB_ORIGIN}/view_video.php?viewkey=ph${profile.id}`
        }
      ]
    });
  }
  
  return result;
}
