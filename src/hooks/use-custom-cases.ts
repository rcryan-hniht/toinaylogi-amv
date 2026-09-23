import { useCallback, useEffect, useState } from 'react';
import {
  type CustomCase,
  type CustomCaseItem,
  type CustomCaseStore,
  type CaseDropMode,
  loadStore,
  saveStore,
  createCase,
  addCaseToStore,
  removeCaseFromStore,
  updateCaseInStore,
  setActiveCase as setActiveCaseInStore,
  importCase,
  exportCase,
  DEFAULT_PRESET_CASES,
} from '@/lib/custom-cases';

export function useCustomCases() {
  const [store, setStore] = useState<CustomCaseStore>({
    version: 1,
    activeCaseId: null,
    cases: DEFAULT_PRESET_CASES,
  });

  useEffect(() => {
    setStore(loadStore());
  }, []);

  const persist = useCallback((next: CustomCaseStore) => {
    setStore(next);
    saveStore(next);
  }, []);

  const addCase = useCallback(
    (
      name: string,
      items: CustomCaseItem[],
      options?: {
        description?: string;
        icon?: string;
        accentColor?: string;
        dropMode?: CaseDropMode;
        tierRates?: [number, number, number, number, number];
      },
    ): boolean => {
      const newCase = createCase(name, items, options);
      if (!newCase) return false;
      const next = addCaseToStore(store, newCase);
      if (next === store) return false;
      persist(next);
      return true;
    },
    [store, persist],
  );

  const removeCase = useCallback(
    (caseId: string) => {
      persist(removeCaseFromStore(store, caseId));
    },
    [store, persist],
  );

  const updateCase = useCallback(
    (updated: CustomCase) => {
      persist(updateCaseInStore(store, { ...updated, updatedAt: Date.now() }));
    },
    [store, persist],
  );

  const setActiveCase = useCallback(
    (caseId: string | null) => {
      persist(setActiveCaseInStore(store, caseId));
    },
    [store, persist],
  );

  const incrementSpinCount = useCallback(
    (caseId: string) => {
      const target = store.cases.find((c) => c.id === caseId);
      if (!target) return;
      persist(
        updateCaseInStore(store, {
          ...target,
          spinCount: target.spinCount + 1,
        }),
      );
    },
    [store, persist],
  );

  const doImport = useCallback(
    (json: string): boolean => {
      const imported = importCase(json);
      if (!imported) return false;
      const next = addCaseToStore(store, { ...imported, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) });
      if (next === store) return false;
      persist(next);
      return true;
    },
    [store, persist],
  );

  const doExport = useCallback(
    (caseId: string): string | null => {
      const target = store.cases.find((c) => c.id === caseId);
      return target ? exportCase(target) : null;
    },
    [store],
  );

  const activeCase = store.activeCaseId
    ? store.cases.find((c) => c.id === store.activeCaseId) ?? null
    : null;

  return {
    store,
    activeCase,
    cases: store.cases,
    addCase,
    removeCase,
    updateCase,
    setActiveCase,
    incrementSpinCount,
    importCase: doImport,
    exportCase: doExport,
  };
}

export type CustomCases = ReturnType<typeof useCustomCases>;
