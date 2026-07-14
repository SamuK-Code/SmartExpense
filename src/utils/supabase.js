import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// ✅ SEGURANÇA: Carrega do app.config.js (extra) em produção
// Em desenvolvimento (Expo Go), usa valores do .env via Constants
const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[SmartExpense] ⚠️ Credenciais do Supabase não configuradas no app.config.js');
  console.warn('[SmartExpense] ℹ️  Adicione no app.config.js:');
  console.warn('    extra: { SUPABASE_URL: "...", SUPABASE_ANON_KEY: "..." }');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});