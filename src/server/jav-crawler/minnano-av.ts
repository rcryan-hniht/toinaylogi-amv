import type { ActressRatings } from '@/lib/actresses';
import type { ParsedProfile } from './parser';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

export type MinnanoAvProfile = {
  name: string;
  url: string;
  ratings?: ActressRatings;
  tags: string[];
  debutYear?: number;
};

export type MinnanoAvLookup =
  | { kind: 'matched'; profile: MinnanoAvProfile; url: string }
  | { kind: 'not-found' }
  | { kind: 'unavailable'; message: string };

export type MinnanoAvEnrichmentStats = {
  provider: 'minnano-av';
  attempted: number;
  matched: number;
  skipped: number;
  blocked: number;
};

const CRITERIA_MAP: Record<string, keyof ActressRatings> = {
  ルックス: 'looks',
  カラダ: 'body',
  魅力: 'charm',
  ヌケる: 'eroticAppeal',
  総合評価: 'overall',
};

/**
 * Normalizes text for strict identity comparison:
 * Handles Unicode NFKC, macrons (e.g. Yūki -> Yuki), case, spaces, and punctuation.
 */
export function normalizeName(s: string): string {
  return (s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒòūúǔù]/g, (m) =>
      m === 'ū' || m === 'ú' || m === 'ǔ' || m === 'ù' ? 'u' : 'o',
    )
    .replace(/[\s\-_・\(\)（）\/\\【】「」]/g, '');
}

export type MinnanoIdentity = {
  h1: string;
  cleanTitleName: string;
  romajiName: string;
  aliases: string[];
  normalizedNames: string[];
};

export function extractMinnanoIdentity(html: string): MinnanoIdentity | null {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1Match) return null;
  const h1 = h1Match[1].replace(/<[^>]+>/g, '').trim();
  const [left, right] = h1.split('/').map((s) => (s ? s.trim() : ''));

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1]
        .replace(/- AV女優プロフィール[\s\S]*/, '')
        .replace(/みんなのAV[\s\S]*/, '')
        .trim()
    : '';

  const cleanTitleName = title
    .replace(/（[^）]*）|\([^\)]*\)|【[^】]*】/g, '')
    .trim();

  const aliasBlocks = [...html.matchAll(/別名\s*([^<\r\n]+)/g)].map((m) =>
    m[1].replace(/（[^）]*）|\([^\)]*\)|【[^】]*】/g, '').trim(),
  );

  const allNames = [cleanTitleName, left, right, ...aliasBlocks].filter(
    Boolean,
  );

  return {
    h1,
    cleanTitleName: cleanTitleName || left,
    romajiName: right || '',
    aliases: aliasBlocks,
    normalizedNames: allNames.map(normalizeName).filter(Boolean),
  };
}

export function matchesIdentity(
  candidates: string[],
  identity: MinnanoIdentity,
): boolean {
  for (const candidate of candidates) {
    const norm = normalizeName(candidate);
    if (!norm) continue;
    if (identity.normalizedNames.includes(norm)) {
      return true;
    }
  }
  return false;
}

export function parseMinnanoAvProfile(
  html: string,
  pageUrl: string,
): MinnanoAvProfile {
  // 1. Actress Name
  const identity = extractMinnanoIdentity(html);
  const name = identity?.cleanTitleName || identity?.romajiName || 'Unknown';

  // 2. Quantitative Ratings (table.rate-table)
  const ratings: ActressRatings = {};
  const rateTableMatch = html.match(
    /<table[^>]*class=["'][^"']*rate-table[^"']*["'][\s\S]*?<\/table>/i,
  );
  if (rateTableMatch) {
    const rows = [...rateTableMatch[0].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
    for (const row of rows) {
      const cols = [
        ...row[1].matchAll(/<td class="t9">([\s\S]*?)<\/td>/gi),
      ].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
      if (cols.length >= 2) {
        const [rawCriteria, scoreStr] = cols;
        const key = CRITERIA_MAP[rawCriteria];
        const num = parseFloat(scoreStr);
        if (key && !Number.isNaN(num) && num >= 0 && num <= 10) {
          ratings[key] = Math.round(num * 100) / 100;
        }
      }
    }
  }

  // 3. Tags (<div class="tagarea">) - store original text for tags
  const rawTags: string[] = [];
  const tagAreaMatch = html.match(/<div class="tagarea">([\s\S]*?)<\/div>/i);
  if (tagAreaMatch) {
    const linkMatches = [
      ...tagAreaMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g),
    ].map((m) => m[1].trim());
    rawTags.push(...linkMatches);
  }

  const tags = [...new Set(rawTags.map((t) => t.trim()).filter(Boolean))];

  // 4. Debut Year
  let debutYear: number | undefined;
  const debutWorkMatch = html.match(
    /<span>デビュー作品<\/span>[\s\S]*?（(\d{4})年/i,
  );
  if (debutWorkMatch) {
    const parsed = parseInt(debutWorkMatch[1], 10);
    if (!Number.isNaN(parsed) && parsed >= 1980 && parsed <= 2035) {
      debutYear = parsed;
    }
  }
  if (!debutYear) {
    const periodMatch = html.match(
      /<span>AV出演期間<\/span>[\s\S]*?(\d{4})年/i,
    );
    if (periodMatch) {
      const parsed = parseInt(periodMatch[1], 10);
      if (!Number.isNaN(parsed) && parsed >= 1980 && parsed <= 2035) {
        debutYear = parsed;
      }
    }
  }

  const hasAnyRating = Object.keys(ratings).length > 0;

  return {
    name,
    url: pageUrl,
    ratings: hasAnyRating ? ratings : undefined,
    tags,
    debutYear,
  };
}

async function fetchPage(
  url: string,
): Promise<{ url: string; html: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { url: res.url, html };
  } catch {
    return null;
  }
}

/**
 * Searches Minnano-AV for an actress using candidate names and ensures
 * strict identity verification to avoid substring mismatches (e.g. Meguri vs Minoshima Meguri).
 */
export async function searchMinnanoAv(
  query: string,
  candidates: string[],
): Promise<MinnanoAvProfile | null> {
  const clean = query.trim();
  if (!clean) return null;

  const searchUrl = `https://www.minnano-av.com/search_result.php?search_scope=actress&search_word=${encodeURIComponent(clean)}`;
  const response = await fetchPage(searchUrl);
  if (!response) return null;

  // Case 1: Direct 302 redirect to actress profile
  if (
    response.url.includes('actress') &&
    !response.url.includes('search_result')
  ) {
    const identity = extractMinnanoIdentity(response.html);
    if (identity && matchesIdentity(candidates, identity)) {
      return parseMinnanoAvProfile(response.html, response.url);
    }
    // Redirected to wrong/unrelated actress, reject!
    return null;
  }

  // Case 2: Landed on search results list
  const results = [
    ...response.html.matchAll(
      /<h2 class="ttl"><a href="([^"]*actress\d+\.html)[^"]*">([^<]+)<\/a><\/h2>/gi,
    ),
  ].map((m) => ({
    url: m[1].startsWith('http')
      ? m[1]
      : `https://www.minnano-av.com/${m[1].replace(/^\/+/, '')}`,
    title: m[2].trim(),
    normTitle: normalizeName(
      m[2].trim().replace(/（[^）]*）|\([^\)]*\)|【[^】]*】/g, ''),
    ),
  }));

  if (!results.length) return null;

  // Priority 1: Exact title match in the results list
  const exact = results.find((r) =>
    candidates.some((c) => normalizeName(c) === r.normTitle),
  );

  if (exact) {
    const page = await fetchPage(exact.url);
    if (page) {
      const identity = extractMinnanoIdentity(page.html);
      if (identity && matchesIdentity(candidates, identity)) {
        return parseMinnanoAvProfile(page.html, exact.url);
      }
    }
  }

  // Priority 2: Inspect top candidate result pages (e.g. if actress renamed or title has former alias)
  for (const r of results.slice(0, 5)) {
    if (r === exact) continue;
    const page = await fetchPage(r.url);
    if (page) {
      const identity = extractMinnanoIdentity(page.html);
      if (identity && matchesIdentity(candidates, identity)) {
        return parseMinnanoAvProfile(page.html, r.url);
      }
    }
  }

  return null;
}

export function mergeMinnanoAvProfile(
  base: ParsedProfile,
  minnano: MinnanoAvProfile,
  minnanoAvUrl: string,
): ParsedProfile {
  return {
    ...base,
    minnanoAvUrl,
    ratings: minnano.ratings ?? base.ratings,
    tags: minnano.tags.length ? minnano.tags : base.tags,
    debutYear: minnano.debutYear ?? base.debutYear,
  };
}

export function createMinnanoAvEnricher() {
  const stats: MinnanoAvEnrichmentStats = {
    provider: 'minnano-av',
    attempted: 0,
    matched: 0,
    skipped: 0,
    blocked: 0,
  };
  let circuitOpen = false;

  const lookup = async (
    profile: Pick<
      ParsedProfile,
      'name' | 'aliases' | 'nativeName' | 'nameReading'
    >,
  ): Promise<MinnanoAvLookup> => {
    if (circuitOpen) {
      stats.skipped++;
      return {
        kind: 'unavailable',
        message: 'Minnano-AV circuit breaker open',
      };
    }

    // Candidate search terms in order of priority:
    // 1. Japanese nativeName (e.g. "彩月七緒", "めぐり")
    // 2. English / Romaji name (e.g. "Satsuki Nao", "MINAMO")
    // 3. Hiragana ruby (e.g. "さつきなお")
    // 4. Aliases (e.g. "藤浦めぐ")
    const searchTerms = [
      profile.nativeName,
      profile.name,
      profile.nameReading,
      ...profile.aliases,
    ]
      .filter((v): v is string => Boolean(v && typeof v === 'string'))
      .map((v) => v.trim())
      .filter((v, i, arr) => v.length > 1 && arr.indexOf(v) === i);

    const allCandidates = [
      profile.nativeName,
      profile.name,
      profile.nameReading,
      ...profile.aliases,
    ].filter((v): v is string => Boolean(v && typeof v === 'string'));

    for (const term of searchTerms) {
      stats.attempted++;
      try {
        const found = await searchMinnanoAv(term, allCandidates);
        if (found) {
          stats.matched++;
          return { kind: 'matched', profile: found, url: found.url };
        }
      } catch (error) {
        console.warn(`[minnano-av] Lookup error for "${term}":`, error);
      }
    }

    stats.skipped++;
    return { kind: 'not-found' };
  };

  return { lookup, stats };
}
