// Custom personal case builder - data types and validation
// Stores custom cases in localStorage (bounded, validated)

export type CaseDropMode = 'csgo_tier' | 'custom_weight';

export interface CustomCaseItem {
  id: string;
  name: string;
  imagePath: string;
  tier: number;
  weight?: number;
}

export interface CustomCase {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  accentColor?: string;
  createdAt: number;
  updatedAt: number;
  spinCount: number;
  dropMode: CaseDropMode;
  tierRates?: [number, number, number, number, number];
  items: CustomCaseItem[];
}

export const DEFAULT_PRESET_CASES: CustomCase[] = [
  {
    id: 'case-usuk',
    name: 'Hòm US&UK',
    description: 'Hòm các nữ diễn viên US&UK',
    icon: '🇺🇸',
    createdAt: 1727092800000,
    updatedAt: 1727092800000,
    spinCount: 0,
    dropMode: 'csgo_tier',
    items: [
      {
        id: 'comatozze',
        name: 'Comatozze',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/comatozze.jpg',
        tier: 4,
      },
      {
        id: 'sweetie-fox',
        name: 'Sweetie Fox',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/sweetie-fox.jpg',
        tier: 4,
      },
      {
        id: 'violet-myers',
        name: 'Violet Myers',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/violet-myers.jpg',
        tier: 3,
      },
      {
        id: 'skylar-vox',
        name: 'Skylar Vox',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/skylar-vox.jpg',
        tier: 2,
      },
      {
        id: 'reslin',
        name: 'Reislin',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/reslin.jpg',
        tier: 1,
      },
      {
        id: 'octavia-red',
        name: 'Octavia Red',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/octavia-red.jpg',
        tier: 0,
      },
      {
        id: 'skye-blue',
        name: 'Skye Blue',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/skye-blue.jpg',
        tier: 0,
      },
      {
        id: 'polly-yangs',
        name: 'Polly Yangs',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/polly-yangs.jpg',
        tier: 0,
      },
      {
        id: 'charli-o',
        name: 'Charli O',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/charli-o.jpg',
        tier: 3,
      },
      {
        id: 'stella-cox',
        name: 'Stella Cox',
        imagePath:
          '/actress-cache/snapshots/2026-09-21t14-14-17-245z-3df7e3a3/images/stella-cox.jpg',
        tier: 3,
      },
    ],
  },
];

export interface CustomCaseStore {
  version: 1;
  activeCaseId: string | null;
  cases: CustomCase[];
}

const STORE_KEY = 'toinaylogi:custom_cases:v1';
const MAX_CASES = 15;
const MIN_ITEMS = 5;
const MAX_ITEMS = 100;
const MAX_NAME_LENGTH = 50;
const MAX_DESC_LENGTH = 200;

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function sanitizeString(s: string, max: number): string {
  return String(s)
    .replace(/[<>"'&]/g, '')
    .trim()
    .slice(0, max);
}

function validateItem(raw: unknown): CustomCaseItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    typeof v.imagePath !== 'string' ||
    typeof v.tier !== 'number'
  )
    return null;
  const tier = Math.max(0, Math.min(4, Math.floor(v.tier)));
  const weight =
    typeof v.weight === 'number' && v.weight >= 1 && v.weight <= 100
      ? Math.floor(v.weight)
      : undefined;
  return {
    id: sanitizeString(v.id, 100),
    name: sanitizeString(v.name, 100),
    imagePath: sanitizeString(v.imagePath, 500),
    tier,
    weight,
  };
}

function validateCase(raw: unknown): CustomCase | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return null;
  if (!Array.isArray(v.items) || v.items.length < MIN_ITEMS || v.items.length > MAX_ITEMS)
    return null;
  const items = v.items.map(validateItem).filter(Boolean) as CustomCaseItem[];
  if (items.length < MIN_ITEMS) return null;
  const dropMode: CaseDropMode =
    v.dropMode === 'custom_weight' ? 'custom_weight' : 'csgo_tier';
  let tierRates: [number, number, number, number, number] | undefined;
  if (
    Array.isArray(v.tierRates) &&
    v.tierRates.length === 5 &&
    v.tierRates.every((r: unknown) => typeof r === 'number' && r >= 0)
  ) {
    const sum = (v.tierRates as number[]).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      tierRates = (v.tierRates as number[]).map((r) => r / sum) as [
        number,
        number,
        number,
        number,
        number,
      ];
    }
  }
  return {
    id: sanitizeString(v.id, 100),
    name: sanitizeString(v.name, MAX_NAME_LENGTH),
    description:
      typeof v.description === 'string'
        ? sanitizeString(v.description, MAX_DESC_LENGTH)
        : undefined,
    icon: typeof v.icon === 'string' ? sanitizeString(v.icon, 50) : undefined,
    accentColor:
      typeof v.accentColor === 'string' && /^#[0-9a-f]{3,8}$/i.test(v.accentColor)
        ? v.accentColor
        : undefined,
    createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
    updatedAt: typeof v.updatedAt === 'number' ? v.updatedAt : Date.now(),
    spinCount: typeof v.spinCount === 'number' ? Math.max(0, Math.floor(v.spinCount)) : 0,
    dropMode,
    tierRates,
    items: items.slice(0, MAX_ITEMS),
  };
}

export function loadStore(): CustomCaseStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { version: 1, activeCaseId: null, cases: [...DEFAULT_PRESET_CASES] };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.cases))
      return { version: 1, activeCaseId: null, cases: [...DEFAULT_PRESET_CASES] };
    const userCases = parsed.cases
      .map(validateCase)
      .filter(Boolean) as CustomCase[];
    const cases = [...userCases];
    for (const preset of DEFAULT_PRESET_CASES) {
      if (!cases.some((c) => c.id === preset.id)) {
        cases.unshift(preset);
      }
    }
    const limitedCases = cases.slice(0, MAX_CASES);
    const activeCaseId =
      typeof parsed.activeCaseId === 'string' &&
      limitedCases.some((c) => c.id === parsed.activeCaseId)
        ? parsed.activeCaseId
        : null;
    return { version: 1, activeCaseId, cases: limitedCases };
  } catch {
    return { version: 1, activeCaseId: null, cases: [...DEFAULT_PRESET_CASES] };
  }
}

export function saveStore(store: CustomCaseStore): boolean {
  try {
    const json = JSON.stringify(store);
    localStorage.setItem(STORE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function createCase(
  name: string,
  items: CustomCaseItem[],
  options?: {
    description?: string;
    icon?: string;
    accentColor?: string;
    dropMode?: CaseDropMode;
    tierRates?: [number, number, number, number, number];
  },
): CustomCase | null {
  const cleanName = sanitizeString(name, MAX_NAME_LENGTH);
  if (cleanName.length < 2) return null;
  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) return null;
  const validItems = items.map(validateItem).filter(Boolean) as CustomCaseItem[];
  if (validItems.length < MIN_ITEMS) return null;
  return {
    id: generateId(),
    name: cleanName,
    description: options?.description
      ? sanitizeString(options.description, MAX_DESC_LENGTH)
      : undefined,
    icon: options?.icon,
    accentColor: options?.accentColor,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    spinCount: 0,
    dropMode: options?.dropMode ?? 'csgo_tier',
    tierRates: options?.tierRates,
    items: validItems,
  };
}

export function addCaseToStore(
  store: CustomCaseStore,
  newCase: CustomCase,
): CustomCaseStore {
  if (store.cases.length >= MAX_CASES) return store;
  return {
    ...store,
    cases: [...store.cases, newCase],
  };
}

export function removeCaseFromStore(
  store: CustomCaseStore,
  caseId: string,
): CustomCaseStore {
  const cases = store.cases.filter((c) => c.id !== caseId);
  return {
    ...store,
    activeCaseId: store.activeCaseId === caseId ? null : store.activeCaseId,
    cases,
  };
}

export function updateCaseInStore(
  store: CustomCaseStore,
  updated: CustomCase,
): CustomCaseStore {
  return {
    ...store,
    cases: store.cases.map((c) => (c.id === updated.id ? updated : c)),
  };
}

export function setActiveCase(
  store: CustomCaseStore,
  caseId: string | null,
): CustomCaseStore {
  return { ...store, activeCaseId: caseId };
}

export function exportCase(c: CustomCase): string {
  return JSON.stringify(c, null, 2);
}

export function importCase(json: string): CustomCase | null {
  try {
    return validateCase(JSON.parse(json));
  } catch {
    return null;
  }
}

export {
  MAX_CASES,
  MIN_ITEMS,
  MAX_ITEMS,
  MAX_NAME_LENGTH,
  MAX_DESC_LENGTH,
  generateId,
};
