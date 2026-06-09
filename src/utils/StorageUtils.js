import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Limpa TODOS os dados do AsyncStorage
 * Útil para reset completo do app
 */
export async function clearAllStorage() {
  try {
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage limpo completamente');
    return true;
  } catch (error) {
    console.error('❌ Erro ao limpar AsyncStorage:', error);
    return false;
  }
}

/**
 * Lista todas as chaves no AsyncStorage (para debug)
 */
export async function listStorageKeys() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('Chaves no AsyncStorage:', keys);
    return keys;
  } catch (error) {
    console.error('Erro ao listar chaves:', error);
    return [];
  }
}
