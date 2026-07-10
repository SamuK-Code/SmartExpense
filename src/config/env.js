// src/config/env.js — Variáveis de ambiente centralizadas
// NUNCA coloque chaves hardcoded aqui!
// As chaves vêm de: app.config.js → Constants.expoConfig.extra

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const SUPABASE_URL = extra.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || '';
export const GOOGLE_VISION_API_KEY = extra.GOOGLE_VISION_API_KEY || '';

// Validação em desenvolvimento
if (__DEV__) {
  if (!SUPABASE_URL) {
    console.warn('[env.js] ⚠️ SUPABASE_URL não configurado. Crie um arquivo .env na raiz do projeto.');
  }
  if (!SUPABASE_ANON_KEY) {
    console.warn('[env.js] ⚠️ SUPABASE_ANON_KEY não configurado. Crie um arquivo .env na raiz do projeto.');
  }
  if (!GOOGLE_VISION_API_KEY) {
    console.warn('[env.js] ⚠️ GOOGLE_VISION_API_KEY não configurado. O scanner de comprovantes não funcionará.');
  }
}