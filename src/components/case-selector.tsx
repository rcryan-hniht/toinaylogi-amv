'use client';

import { Plus, Package } from 'lucide-react';
import type { CustomCases } from '@/hooks/use-custom-cases';
import type { Language } from '@/lib/i18n';

interface CaseSelectorProps {
  customCases: CustomCases;
  language: Language;
  disabled?: boolean;
  onCreateNew: () => void;
}

const labels = {
  vi: {
    defaultCase: 'Hòm AV',
    createNew: 'Tạo Hòm',
    items: 'vật phẩm',
    spins: 'lượt mở',
  },
  en: {
    defaultCase: 'AV Case',
    createNew: 'New Case',
    items: 'items',
    spins: 'opens',
  },
} as const;

export function CaseSelector({
  customCases,
  language,
  disabled,
  onCreateNew,
}: CaseSelectorProps) {
  const t = labels[language];
  const { cases, activeCase, setActiveCase } = customCases;

  if (cases.length === 0) {
    return (
      <div className="case-selector">
        <button
          className="case-selector-tab active"
          disabled={disabled}
        >
          <Package size={14} />
          {t.defaultCase}
        </button>
        <button
          className="case-selector-add"
          onClick={onCreateNew}
          disabled={disabled}
        >
          <Plus size={14} /> {t.createNew}
        </button>
      </div>
    );
  }

  return (
    <div className="case-selector">
      <button
        className={`case-selector-tab ${!activeCase ? 'active' : ''}`}
        onClick={() => setActiveCase(null)}
        disabled={disabled}
      >
        {t.defaultCase}
      </button>
      {cases.map((c) => (
        <button
          key={c.id}
          className={`case-selector-tab ${activeCase?.id === c.id ? 'active' : ''}`}
          onClick={() => setActiveCase(c.id)}
          disabled={disabled}
          title={`${c.items.length} ${t.items} · ${c.spinCount} ${t.spins}`}
        >
          {c.icon || '📦'} {c.name}
        </button>
      ))}
      <button
        className="case-selector-add"
        onClick={onCreateNew}
        disabled={disabled}
      >
        <Plus size={14} /> {t.createNew}
      </button>
    </div>
  );
}
