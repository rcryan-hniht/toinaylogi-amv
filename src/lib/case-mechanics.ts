// CS:GO Panorama timing reconstructed from popup_capability_decodable.js/.css.
// Reference: https://github.com/Desynci/CSGO_Panorama_Code.pbin
export const OPENING_DELAY_MS = 2400;
export const SPIN_DURATION_MS = 6000;
export const TICK_SECONDS = [
  0, 0.063, 0.125, 0.188, 0.25, 0.313, 0.375, 0.438, 0.5, 0.563, 0.625, 0.688,
  0.75, 0.813, 0.875, 0.938, 1, 1.063, 1.125, 1.188, 1.25, 1.313, 1.375, 1.483,
  1.351, 1.62, 1.701, 1.786, 1.872, 2.003, 2.154, 2.313, 2.466, 2.615, 2.773,
  2.941, 3.104, 3.339, 3.63, 3.953, 4.385, 5.004,
].sort((a, b) => a - b);

export const TIER_DROP_RATES = [0.6, 0.25, 0.1, 0.04, 0.01] as const;
type Tiered = { tier: number };

export function chooseTiered<T extends Tiered>(
  items: T[],
  random = Math.random,
): T {
  if (!items.length) throw new Error('No eligible actresses');
  const groups = TIER_DROP_RATES.map((_, tier) =>
    items.filter((item) => item.tier === tier),
  );
  const total = TIER_DROP_RATES.reduce(
    (sum, rate, tier) => sum + (groups[tier].length ? rate : 0),
    0,
  );
  if (!total) throw new Error('No eligible tiers');
  const tierDraw = random();
  if (!Number.isFinite(tierDraw) || tierDraw < 0 || tierDraw >= 1)
    throw new Error('Random draw must be in [0,1)');
  let draw = tierDraw * total;
  for (let tier = 0; tier < groups.length; tier++) {
    if (!groups[tier].length) continue;
    draw -= TIER_DROP_RATES[tier];
    if (draw < 0) {
      const pick = random();
      if (!Number.isFinite(pick) || pick < 0 || pick >= 1)
        throw new Error('Random draw must be in [0,1)');
      return groups[tier][Math.floor(pick * groups[tier].length)];
    }
  }
  for (let tier = groups.length - 1; tier >= 0; tier--) {
    if (groups[tier].length) return groups[tier][groups[tier].length - 1];
  }
  throw new Error('No eligible tiers');
}

export function stopFraction(random = Math.random) {
  return (Math.floor(random() * 81) + 10) / 100;
}

// Cosmetic motion is independent of reward selection. Every profile is monotonic
// and finishes at zero velocity; vary travel, duration and drag between rolls.
export function createSpinProfile(random = Math.random, reducedMotion = false) {
  if (reducedMotion)
    return {
      durationMs: 4000 + Math.floor(random() * 1001),
      tiles: 10 + Math.floor(random() * 4),
      friction: 2.7 + random() * 0.6,
    };
  return {
    durationMs: 7500 + Math.floor(random() * 2001),
    tiles: 30 + Math.floor(random() * 11),
    friction: 2.7 + random() * 0.6,
  };
}
export function spinProgress(progress: number, friction: number) {
  const p = Math.max(0, Math.min(1, progress));
  return 1 - Math.pow(1 - p, friction);
}

/**
 * Near-miss injection: with 45% probability, place a high-tier item
 * at position K-1 or K+1 relative to the winner position K.
 * This replicates the CS:GO "almost got the knife" suspense effect.
 */
export function injectNearMiss<T extends Tiered>(
  strip: T[],
  winnerIndex: number,
  pool: T[],
  random = Math.random,
): void {
  if (random() > 0.45) return;
  const highTier = pool.filter((item) => item.tier >= 3);
  if (!highTier.length) return;
  const offset = random() < 0.5 ? -1 : 1;
  const target = winnerIndex + offset;
  if (target < 0 || target >= strip.length) return;
  if (strip[target].tier >= 3) return; // already rare, skip
  strip[target] = highTier[Math.floor(random() * highTier.length)];
}

/**
 * Choose an item using custom weights (for custom_weight drop mode).
 * Each item has a .weight property; probability is weight / totalWeight.
 */
export function chooseWeighted<T extends { weight?: number }>(
  items: T[],
  random = Math.random,
): T {
  if (!items.length) throw new Error('No eligible items');
  const weights = items.map((item) => Math.max(1, item.weight ?? 1));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let draw = random() * total;
  for (let i = 0; i < items.length; i++) {
    draw -= weights[i];
    if (draw < 0) return items[i];
  }
  return items[items.length - 1];
}
