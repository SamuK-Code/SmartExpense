// src/config/env.js — Variáveis de ambiente (Expo SDK 56)
// NUNCA coloque chaves aqui! Use process.env ou expo-constants

import Constants from 'expo-constants';

// Pega do EAS Build ou do app.json
const extra = Constants.expoConfig?.extra || {};

export const SUPABASE_URL = process.env.SUPABASE_URL || extra.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || extra.SUPABASE_ANON_KEY || '';
export const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY || extra.GOOGLE_VISION_API_KEY || '';

// Validação
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[env.js] SUPABASE_URL ou SUPABASE_ANON_KEY não configurados!');
}