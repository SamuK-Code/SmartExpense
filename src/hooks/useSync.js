import { useEffect, useCallback, useRef } from 'react';
import { useGroup } from '../contexts/GroupContext';
import SyncService from '../services/SyncService';

/**
 * Hook: useSync
 * 
 * Integra sincronização automática com seus contexts existentes.
 * 
 * Uso no seu ExpenseContext ou PlanningContext:
 * 
 * const { startSync, stopSync, syncNow } = useSync({
 *   getLocalData: () => ({
 *     expenses: expenses,
 *     categories: categories,
 *     cards: cards,
 *     cashBalance: cashBalance,
 *   }),
 *   onDataReceived: (mergedData) => {
 *     // Atualiza seus states com dados recebidos
 *     setExpenses(mergedData.expenses);
 *     setCategories(mergedData.categories);
 *     // etc...
 *   },
 * });
 */

export const useSync = ({ getLocalData, onDataReceived }) => {
  const { activeGroup, addSyncListener } = useGroup();
  const syncStarted = useRef(false);

  // Inicia sincronização automática quando entra em um grupo
  useEffect(() => {
    if (!activeGroup || !activeGroup.settings.syncEnabled) {
      if (syncStarted.current) {
        SyncService.stopAutoSync();
        syncStarted.current = false;
      }
      return;
    }

    const start = async () => {
      await SyncService.initialize(activeGroup.settings.syncMode);

      if (activeGroup.settings.autoSync) {
        SyncService.startAutoSync(
          activeGroup.id,
          activeGroup.members.find(m => m.role === 'admin' || m.role === 'member')?.id,
          getLocalData,
          onDataReceived,
          activeGroup.settings.syncInterval
        );
        syncStarted.current = true;
      }
    };

    start();

    return () => {
      SyncService.stopAutoSync();
      syncStarted.current = false;
    };
  }, [activeGroup, getLocalData, onDataReceived]);

  // Escuta eventos de sync do GroupContext
  useEffect(() => {
    const unsubscribe = addSyncListener((event) => {
      if (event.type === 'data_received') {
        onDataReceived(event.data);
      }
    });
    return unsubscribe;
  }, [addSyncListener, onDataReceived]);

  // Sincronização manual
  const syncNow = useCallback(async () => {
    if (!activeGroup) return { success: false, error: 'Sem grupo ativo' };

    const localData = getLocalData();
    const result = await SyncService.syncViaInternet(
      activeGroup.id,
      localData,
      activeGroup.members[0]?.id
    );

    if (result.success) {
      onDataReceived(result.data);
    }

    return result;
  }, [activeGroup, getLocalData, onDataReceived]);

  // Para sync
  const stopSync = useCallback(() => {
    SyncService.stopAutoSync();
    syncStarted.current = false;
  }, []);

  return { syncNow, stopSync };
};

export default useSync;
