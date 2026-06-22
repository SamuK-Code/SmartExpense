// supabase.js — Configuração segura do Supabase Client para React Native/Expo
// ⚠️ Credenciais via EAS Secrets (process.env)

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[SmartExpense] ❌ Credenciais do Supabase não configuradas!\n' +
    'Verifique se as EAS Secrets SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas.'
  );
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});