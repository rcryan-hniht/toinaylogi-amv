'use client';

import { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import type { Actress } from '@/lib/actresses';
import type { CustomCaseItem, CaseDropMode } from '@/lib/custom-cases';
import { MIN_ITEMS, MAX_ITEMS, MAX_NAME_LENGTH, MAX_DESC_LENGTH } from '@/lib/custom-cases';
import type { Language } from '@/lib/i18n';

const TIER_LABELS_VI = ['QUỐC DÂN', 'HIẾM', 'CỰC PHẨM', 'TỐI MẬT', '★ ĐẶC BIỆT'];
const TIER_LABELS_EN = ['MIL-SPEC', 'RESTRICTED', 'CLASSIFIED', 'COVERT', '★ SPECIAL'];
const TIER_COLORS = ['#4b69ff', '#8847ff', '#d32ce6', '#eb4b4b', '#ffd700'];

interface Props {
  actresses: Actress[];
  language: Language;
  onSave: (
    name: string,
    items: CustomCaseItem[],
    options: {
      description?: string;
      dropMode: CaseDropMode;
    },
  ) => boolean;
  onClose: () => void;
}

const labels = {
  vi: {
    title: 'Tạo Hòm Cá Nhân',
    step1: 'Thông Tin',
    step2: 'Chọn Diễn Viên',
    step3: 'Phẩm Cấp',
    name: 'Tên Hòm',
    namePlaceholder: 'VD: Hòm Thần Tượng 2026',
    description: 'Mô Tả (Tùy Chọn)',
    descPlaceholder: 'Mô tả ngắn về hòm...',
    search: 'Tìm theo tên...',
    selected: 'đã chọn',
    minItems: `Tối thiểu ${MIN_ITEMS} vật phẩm`,
    maxItems: `Tối đa ${MAX_ITEMS} vật phẩm`,
    next: 'Tiếp',
    back: 'Quay Lại',
    save: 'Tạo Hòm',
    cancel: 'Hủy',
    tierMode: 'Chế Độ CS:GO Tier',
    weightMode: 'Chế Độ Trọng Số',
    nameRequired: 'Nhập tên hòm (tối thiểu 2 ký tự)',
    notEnoughItems: `Chọn tối thiểu ${MIN_ITEMS} diễn viên`,
    saved: 'Đã tạo hòm thành công!',
    error: 'Không thể tạo hòm. Kiểm tra bộ nhớ trình duyệt.',
  },
  en: {
    title: 'Create Personal Case',
    step1: 'Info',
    step2: 'Pick Actresses',
    step3: 'Tier Setup',
    name: 'Case Name',
    namePlaceholder: 'e.g. Dream Team 2026',
    description: 'Description (Optional)',
    descPlaceholder: 'Short description...',
    search: 'Search by name...',
    selected: 'selected',
    minItems: `Minimum ${MIN_ITEMS} items`,
    maxItems: `Maximum ${MAX_ITEMS} items`,
    next: 'Next',
    back: 'Back',
    save: 'Create Case',
    cancel: 'Cancel',
    tierMode: 'CS:GO Tier Mode',
    weightMode: 'Weight Mode',
    nameRequired: 'Enter a name (at least 2 characters)',
    notEnoughItems: `Select at least ${MIN_ITEMS} actresses`,
    saved: 'Case created successfully!',
    error: 'Could not create case. Check browser storage.',
  },
} as const;

export function CaseBuilderModal({ actresses, language, onSave, onClose }: Props) {
  const t = labels[language];
  const tierLabels = language === 'vi' ? TIER_LABELS_VI : TIER_LABELS_EN;

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [dropMode, setDropMode] = useState<CaseDropMode>('csgo_tier');
  const [itemTiers, setItemTiers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');

  const filteredActresses = useMemo(() => {
    if (!search.trim()) return actresses;
    const q = search.toLowerCase();
    return actresses.filter(
      (a) =>
        a.publicName.toLowerCase().includes(q) ||
        (a.nativeName && a.nativeName.toLowerCase().includes(q)) ||
        (a.nameReading && a.nameReading.toLowerCase().includes(q)),
    );
  }, [actresses, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_ITEMS) next.add(id);
      return next;
    });
  };

  const selectedActresses = useMemo(
    () => actresses.filter((a) => selectedIds.has(a.id)),
    [actresses, selectedIds],
  );

  const handleSave = () => {
    const items: CustomCaseItem[] = selectedActresses.map((a) => ({
      id: a.id,
      name: a.publicName,
      imagePath: a.imagePath,
      tier: itemTiers[a.id] ?? a.tier,
    }));
    const ok = onSave(name, items, { description: description || undefined, dropMode });
    setMessage(ok ? t.saved : t.error);
    if (ok) setTimeout(onClose, 800);
  };

  return (
    <div className="case-builder-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="case-builder-modal">
        <div className="case-builder-header">
          <h2>{t.title}</h2>
          <button onClick={onClose} className="case-builder-btn-secondary" style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="case-builder-steps">
          <div className={`case-builder-step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`} />
          <div className={`case-builder-step ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`} />
          <div className={`case-builder-step ${step === 3 ? 'active' : ''}`} />
        </div>

        {message && (
          <p style={{ color: message === t.saved ? '#8ec373' : '#ff2a54', fontSize: '12px', textAlign: 'center' }}>
            {message}
          </p>
        )}

        {step === 1 && (
          <>
            <div className="case-builder-field">
              <label>{t.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                placeholder={t.namePlaceholder}
                autoFocus
              />
            </div>
            <div className="case-builder-field">
              <label>{t.description}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC_LENGTH))}
                placeholder={t.descPlaceholder}
              />
            </div>
            <div className="case-builder-actions">
              <button className="case-builder-btn-secondary" onClick={onClose}>{t.cancel}</button>
              <button
                className="case-builder-btn-primary"
                onClick={() => {
                  if (name.trim().length < 2) { setMessage(t.nameRequired); return; }
                  setMessage('');
                  setStep(2);
                }}
              >
                {t.next}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <input
              className="pool-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
            />
            <p style={{ fontSize: '11px', color: '#7a7a92', margin: '6px 0' }}>
              {selectedIds.size} {t.selected} · {t.minItems}
            </p>
            <div className="item-picker-grid">
              {filteredActresses.map((a) => (
                <div
                  key={a.id}
                  className={`item-picker-card ${selectedIds.has(a.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(a.id)}
                >
                  {selectedIds.has(a.id) && (
                    <span className="pick-check"><Check size={10} /></span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imagePath} alt={a.publicName} loading="lazy" />
                  <span className="pick-name">{a.publicName}</span>
                </div>
              ))}
            </div>
            <div className="case-builder-actions">
              <button className="case-builder-btn-secondary" onClick={() => setStep(1)}>{t.back}</button>
              <button
                className="case-builder-btn-primary"
                onClick={() => {
                  if (selectedIds.size < MIN_ITEMS) { setMessage(t.notEnoughItems); return; }
                  setMessage('');
                  // Init tiers from snapshot data
                  const tiers: Record<string, number> = {};
                  selectedActresses.forEach((a) => { tiers[a.id] = a.tier; });
                  setItemTiers(tiers);
                  setStep(3);
                }}
              >
                {t.next} ({selectedIds.size})
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                className={`case-selector-tab ${dropMode === 'csgo_tier' ? 'active' : ''}`}
                onClick={() => setDropMode('csgo_tier')}
              >
                {t.tierMode}
              </button>
              <button
                className={`case-selector-tab ${dropMode === 'custom_weight' ? 'active' : ''}`}
                onClick={() => setDropMode('custom_weight')}
              >
                {t.weightMode}
              </button>
            </div>
            <div className="tier-assign-list">
              {selectedActresses.map((a) => (
                <div key={a.id} className="tier-assign-row">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: TIER_COLORS[itemTiers[a.id] ?? a.tier],
                      flexShrink: 0,
                    }}
                  />
                  <span className="pick-name">{a.publicName}</span>
                  <select
                    value={itemTiers[a.id] ?? a.tier}
                    onChange={(e) =>
                      setItemTiers((prev) => ({
                        ...prev,
                        [a.id]: Number(e.target.value),
                      }))
                    }
                  >
                    {tierLabels.map((label, i) => (
                      <option key={i} value={i}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="case-builder-actions">
              <button className="case-builder-btn-secondary" onClick={() => setStep(2)}>{t.back}</button>
              <button className="case-builder-btn-primary" onClick={handleSave}>
                {t.save}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
