import * as cheerio from 'cheerio';
import {
  canonicalJavUrl,
  isSafeSocialLink,
  type ActressRatings,
  type SocialLink,
} from '@/lib/actresses';

export type RankedMovie = { rank: number; url: string; code: string };
export type MovieWithActresses = {
  movie: RankedMovie;
  actressUrls: string[];
};
export type SingleActressMovie = {
  movie: RankedMovie;
  actressUrls: [string];
};

export function isSingleActressMovie(
  entry: MovieWithActresses,
): entry is SingleActressMovie {
  return entry.actressUrls.length === 1;
}

export function filterSingleActressMovies(
  entries: MovieWithActresses[],
): SingleActressMovie[] {
  return entries.filter(isSingleActressMovie);
}
export type ParsedProfile = {
  sourceUrl: string;
  id: string;
  name: string;
  aliases: string[];
  age?: number;
  cup?: string;
  heightCm?: number;
  videoCount?: number;
  imageUrl?: string;
  socialLinks: SocialLink[];
  nativeName?: string;
  nameReading?: string;
  birthDate?: string;
  bustCm?: number;
  waistCm?: number;
  hipCm?: number;
  bloodType?: string;
  hometown?: string;
  hobby?: string;
  avBaseUrl?: string;
  wikipediaUrl?: string;
  minnanoAvUrl?: string;
  ratings?: ActressRatings;
  tags?: string[];
  debutYear?: number;
};
const compact = (value: string) =>
  value.replace(/\s+/g, ' ').trim().normalize('NFC');
const codeOf = (title: string) =>
  compact(title)
    .match(/^\[([^\]]+)]/)?.[1]
    ?.slice(0, 80) ?? 'UNKNOWN';

export function parseRankingPage(
  html: string,
  startRank: number,
): RankedMovie[] {
  const $ = cheerio.load(html);
  const cards = $('.row > .column > .inside-article').toArray();
  const movies = (cards.length ? cards : $('.inside-article').toArray())
    .map((node, index) => {
      const link = $(node)
        .find('.grid1 h2 a[rel="bookmark"], .imgg a')
        .first()
        .attr('href');
      const title = compact($(node).find('.grid1 h2 a').first().text());
      const url = canonicalJavUrl(link, 'movie');
      return url && title
        ? { rank: startRank + index, url, code: codeOf(title) }
        : null;
    })
    .filter(Boolean) as RankedMovie[];
  if (movies.length < 15)
    throw new Error(
      `Ranking markup changed: only ${movies.length} movies found`,
    );
  return movies;
}

export function parseMovieActressUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const actressRow = $('.infoleft li').filter((_, node) =>
    /^Actresses?\s*:/i.test(compact($(node).find('strong').text())),
  );
  const urls = (actressRow.length ? actressRow : $('.infoleft'))
    .find('a[href*="/actress/"]')
    .toArray()
    .map((node) => canonicalJavUrl($(node).attr('href'), 'actress'))
    .filter(Boolean) as string[];
  return [...new Set(urls)];
}

export function parseActressProfile(
  html: string,
  sourceUrl: string,
): ParsedProfile {
  const $ = cheerio.load(html);
  const card = $('.clean-profile-card').first();
  const name = compact(card.find('.profile-h1').first().text());
  const canonical = canonicalJavUrl(sourceUrl, 'actress');
  if (!canonical || !name) throw new Error('Actress profile markup changed');
  const aliasText = compact(card.find('.cp-alias-row').text()).replace(
    /^Alias:\s*/i,
    '',
  );
  const aliases = aliasText
    ? aliasText
        .split(',')
        .map(compact)
        .filter((item) => item && item !== name)
        .slice(0, 20)
    : [];
  const pills = card
    .find('.cp-stat-pill')
    .toArray()
    .map((node) => compact($(node).text()));
  const age = pills
    .map((text) => text.match(/^Age:\s*(\d{1,3})$/i)?.[1])
    .find(Boolean);
  const height = pills
    .map((text) => text.match(/^(\d{2,3})\s*cm$/i)?.[1])
    .find(Boolean);
  const count = pills
    .map((text) => text.match(/^(\d[\d,]*)\s+Unique Videos$/i)?.[1])
    .find(Boolean);
  const cup = pills.find((text) => /^[A-Z]{1,3}-Cup$/i.test(text));
  const imageUrl = card.find('img.cp-avatar').attr('src');
  const socialLinks = card
    .find('.clean-socials a[href]')
    .toArray()
    .map((node) => {
      const url = $(node).attr('href') ?? '';
      const className = $(node).attr('class') ?? '';
      const label = className.includes('instagram')
        ? 'Instagram'
        : className.includes('twitter')
          ? 'X'
          : null;
      return label && isSafeSocialLink(url, label) ? { label, url } : null;
    })
    .filter(Boolean) as ParsedProfile['socialLinks'];
  return {
    sourceUrl: canonical,
    id: canonical.split('/').filter(Boolean).at(-1)!,
    name,
    aliases,
    age: age ? Number(age) : undefined,
    cup,
    heightCm: height ? Number(height) : undefined,
    videoCount: count ? Number(count.replaceAll(',', '')) : undefined,
    imageUrl,
    socialLinks,
  };
}
