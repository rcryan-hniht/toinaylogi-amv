'use client';

import { useState, useRef } from 'react';
import { X, Download, Upload, Trash2, Copy } from 'lucide-react';
import type { CustomCases } from '@/hooks/use-custom-cases';
import type { Language } from '@/lib/i18n';

interface Props {
  customCases: CustomCases;
  language: Language;
  onClose: () => void;
}

const labels = {
  vi: {
    title: 'Quản Lý Hòm Cá Nhân',
    noCases: 'Chưa có hòm cá nhân nào.',
    items: 'vật phẩm',
    spins: 'lượt mở',
    delete: 'Xóa',
    export: 'Xuất',
    import: 'Nhập Hòm',
    importPlaceholder: 'Dán mã JSON của hòm vào đây...',
    importBtn: 'Nhập',
    importSuccess: 'Nhập hòm thành công!',
    importError: 'JSON không hợp lệ hoặc thiếu dữ liệu.',
    copied: 'Đã sao chép!',
    close: 'Đóng',
    confirmDelete: 'Chắc chắn xóa?',
    duplicate: 'Nhân bản',
  },
  en: {
    title: 'Manage Personal Cases',
    noCases: 'No personal cases yet.',
    items: 'items',
    spins: 'opens',
    delete: 'Delete',
    export: 'Export',
    import: 'Import Case',
    importPlaceholder: 'Paste case JSON here...',
    importBtn: 'Import',
    importSuccess: 'Case imported successfully!',
    importError: 'Invalid JSON or missing data.',
    copied: 'Copied!',
    close: 'Close',
    confirmDelete: 'Are you sure?',
    duplicate: 'Duplicate',
  },
} as const;

export function CaseManagerModal({ customCases, language, onClose }: Props) {
  const t = labels[language];
  const [importJson, setImportJson] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = customCases.importCase(importJson);
    setMessage(ok ? t.importSuccess : t.importError);
    if (ok) setImportJson('');
  };

  const handleExport = (caseId: string) => {
    const json = customCases.exportCase(caseId);
    if (json) {
      navigator.clipboard.writeText(json).then(() => setMessage(t.copied)).catch(() => {});
    }
  };

  const handleDelete = (caseId: string) => {
    if (confirmDeleteId === caseId) {
      customCases.removeCase(caseId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(caseId);
    }
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

        {message && (
          <p style={{
            color: message === t.importSuccess || message === t.copied ? '#8ec373' : '#ff2a54',
            fontSize: '12px',
            textAlign: 'center',
            margin: '0 0 8px',
          }}>
            {message}
          </p>
        )}

        {customCases.cases.length === 0 ? (
          <p style={{ color: '#7a7a92', textAlign: 'center', fontSize: '13px' }}>{t.noCases}</p>
        ) : (
          <div className="my-cases-grid">
            {customCases.cases.map((c) => (
              <div
                key={c.id}
                className={`my-case-card ${customCases.activeCase?.id === c.id ? 'active' : ''}`}
                onClick={() => customCases.setActiveCase(c.id)}
              >
                <h3>{c.icon || '📦'} {c.name}</h3>
                {c.description && <p>{c.description}</p>}
                <div className="case-stats">
                  <span><strong>{c.items.length}</strong> {t.items}</span>
                  <span><strong>{c.spinCount}</strong> {t.spins}</span>
                </div>
                <div className="my-case-actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleExport(c.id)} title={t.export}>
                    <Copy size={12} /> {t.export}
                  </button>
                  <button
                    className={confirmDeleteId === c.id ? 'delete' : ''}
                    onClick={() => handleDelete(c.id)}
                    title={t.delete}
                  >
                    <Trash2 size={12} /> {confirmDeleteId === c.id ? t.confirmDelete : t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' as const, color: '#7a7a92', display: 'block', marginBottom: '6px' }}>
            <Upload size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {t.import}
          </label>
          <textarea
            ref={textareaRef}
            className="import-export-textarea"
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder={t.importPlaceholder}
          />
          <div className="case-builder-actions" style={{ marginTop: '8px' }}>
            <button className="case-builder-btn-secondary" onClick={onClose}>{t.close}</button>
            <button className="case-builder-btn-primary" onClick={handleImport} disabled={!importJson.trim()}>
              <Download size={14} /> {t.importBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
