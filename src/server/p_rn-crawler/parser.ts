import * as cheerio from 'cheerio';
import { type ParsedProfile } from '../jav-crawler/parser';
import { canonicalPornhubUrl, isSafeSocialLink, type SocialLink } from '@/lib/actresses';

const compact = (value: string) => value.replace(/\s+/g, ' ').trim().normalize('NFC');

export interface ParsedPornhubProfile extends ParsedProfile {
  measurements?: string;
  ranks?: {
    weekly?: number;
    monthly?: number;
    yearly?: number;
  };
}

export function parsePornstarProfile(html: string, sourceUrl: string): ParsedPornhubProfile {
  const $ = cheerio.load(html);
  
  const name = compact($('h1[itemprop="name"]').text() || $('.profileUserName').text() || $('h1').first().text());
  const canonical = canonicalPornhubUrl(sourceUrl, 'pornstar');
  if (!canonical || !name) throw new Error('Profile markup changed or invalid URL');
  
  const imageUrl = $('#getAvatar').attr('src');
  
  let heightCm: number | undefined;
  let hometown: string | undefined;
  let debutYear: number | undefined;
  let measurements: string | undefined;
  let cup: string | undefined;
  
  $('.infoPiece').each((_, el) => {
    const text = compact($(el).text());
    if (text.startsWith('Height:')) {
      const match = text.match(/(\d+)\s*cm/i);
      if (match) heightCm = Number(match[1]);
    } else if (text.startsWith('Birth Place:')) {
      hometown = text.replace('Birth Place:', '').trim();
    } else if (text.startsWith('Career Start:')) {
      const match = text.match(/(\d{4})/);
      if (match) debutYear = Number(match[1]);
    } else if (text.startsWith('Measurements:')) {
      measurements = text.replace('Measurements:', '').trim();
      const cupMatch = measurements.match(/^\d+([A-Z]+)/i);
      if (cupMatch) cup = cupMatch[1];
    }
  });

  const ranks: { weekly?: number; monthly?: number; yearly?: number } = {};
  $('.rankNumber').each((_, el) => {
    const numText = $(el).text().replace(/[^\d]/g, '');
    const num = Number(numText);
    const parentText = compact($(el).parent().text()).toLowerCase();
    if (parentText.includes('week')) ranks.weekly = num;
    else if (parentText.includes('month')) ranks.monthly = num;
    else if (parentText.includes('year')) ranks.yearly = num;
  });

  const socialLinks: SocialLink[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (href.includes('twitter.com') || href.includes('x.com')) {
      if (isSafeSocialLink(href, 'X')) socialLinks.push({ label: 'X', url: href });
    } else if (href.includes('instagram.com')) {
      if (isSafeSocialLink(href, 'Instagram')) socialLinks.push({ label: 'Instagram', url: href });
    } else if (href.includes('tiktok.com')) {
      if (isSafeSocialLink(href, 'TikTok')) socialLinks.push({ label: 'TikTok', url: href });
    }
  });
  
  const uniqueSocials: SocialLink[] = [];
  const seen = new Set();
  for (const link of socialLinks) {
    if (!seen.has(link.url)) {
      seen.add(link.url);
      uniqueSocials.push(link);
    }
  }

  return {
    sourceUrl: canonical,
    id: canonical.split('/').filter(Boolean).at(-1)!,
    name,
    aliases: [],
    heightCm,
    hometown,
    debutYear,
    imageUrl,
    socialLinks: uniqueSocials,
    measurements,
    cup,
    ranks,
  };
}

export interface ParsedPornhubVideo {
  title: string;
  videoUrl: string;
  viewkey: string;
  tags: string[];
  uploader?: string;
}

export function parsePornhubVideo(html: string, videoUrl: string): ParsedPornhubVideo {
  const $ = cheerio.load(html);
  const title = compact($('h1.title').text() || $('h1').first().text());
  const canonical = canonicalPornhubUrl(videoUrl, 'video');
  const parsedUrl = new URL(canonical || videoUrl);
  const viewkey = parsedUrl.searchParams.get('viewkey') || '';

  const tags: string[] = [];
  $('.categoriesWrapper a, .tagsWrapper a, .video-info-row a[href*="/category/"], .video-info-row a[href*="/video?c="]').each((_, el) => {
    const text = compact($(el).text());
    if (text && !tags.includes(text) && !text.startsWith('+')) {
      tags.push(text);
    }
  });

  const uploader = compact($('.usernameBadgesWrapper a, .userInfo a, .pornstarName').first().text()) || undefined;

  return {
    title,
    videoUrl: canonical || videoUrl,
    viewkey,
    tags,
    uploader,
  };
}
