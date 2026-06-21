// supabase.js — Configuração segura do Supabase Client para React Native/Expo
// ⚠️ Credenciais via env.js (não commitar!)

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[SmartExpense] ❌ Credenciais do Supabase não configuradas!\n' +
    'Verifique se o arquivo env.js existe em src/utils/env.js\n' +
    'Formato esperado da chave: eyJhbGciOiJIUzI1NiIs... (JWT)'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 🗑️ REMOVIDO: hashPassword — agora usamos Supabase Auth nativo