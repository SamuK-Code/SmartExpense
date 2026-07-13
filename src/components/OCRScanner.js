// OCRScanner.js — Scanner de Comprovantes (OCR)
// ✅ SEGURANÇA: Agora usa Edge Function do Supabase em vez de API key direta no app
// A Google Vision API key fica no servidor, nunca no cliente

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { supabase } from '../utils/supabase';

const OCRScanner = ({ onResult, onClose, visible }) => {
  const { colors } = useTheme();
  const { t } = useTranslate();
  const [loading, setLoading] = useState(false);

  const extractValue = (text) => {
    const patterns = [
      /R\$\s*([\d.]+),\d{2}/gi,
      /R\$\s*([\d.]+)\.(\d{2})/gi,
      /VALOR[\s:]*R\$\s*([\d.,]+)/gi,
      /TOTAL[\s:]*R\$\s*([\d.,]+)/gi,
      /R\$\s*([\d.,]+)/gi,
      /([\d.]+),\d{2}\s*reais/gi,
      /([\d.]+)\.(\d{2})/g,
    ];
    let bestValue = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match
            .replace(/R\$/gi, '')
            .replace(/VALOR/gi, '')
            .replace(/TOTAL/gi, '')
            .replace(/reais/gi, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.]/g, '');
          const val = parseFloat(cleaned);
          if (!isNaN(val) && val > bestValue && val < 1000000) {
            bestValue = val;
          }
        }
      }
    }
    return bestValue > 0 ? bestValue : null;
  };

  const extractDate = (text) => {
    const patterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/g,
      /(\d{2})\/(\d{2})\/(\d{2})/g,
      /(\d{2})-(\d{2})-(\d{4})/g,
      /(\d{4})-(\d{2})-(\d{2})/g,
      /(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/gi,
    ];
    const monthsPt = {
      'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
      'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
      'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
      'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
      'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12,
    };
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        let day, month, year;
        if (match[0].includes('de')) {
          day = parseInt(match[1]);
          month = monthsPt[match[2].toLowerCase()];
          year = parseInt(match[3]);
        } else if (match[0].includes('-') && match[1].length === 4) {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
          if (year < 100) year += 2000;
        }
        if (month && day && year && year >= 2020 && year <= 2035) {
          const date = new Date(year, month - 1, day);
          if (date.getMonth() === month - 1) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }
    return null;
  };

  // ✅ SEGURANÇA: Chama Edge Function do Supabase em vez de usar API key direta
  const callOcrEdgeFunction = async (base64Image) => {
    const { data, error } = await supabase.functions.invoke('ocr-scan', {
      body: { imageBase64: base64Image },
    });
    if (error) throw new Error(error.message || 'Erro no servidor OCR');
    if (!data || data.error) throw new Error(data?.error || 'Erro no OCR');
    return data.text || '';
  };

  const processImage = async (base64Image) => {
    try {
      const fullText = await callOcrEdgeFunction(base64Image);
      if (!fullText) return null;
      const amount = extractValue(fullText);
      const date = extractDate(fullText);
      const lines = fullText.split('\n').filter(l => l.trim().length > 3);
      let description = '';
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (!lower.includes('r$') && 
            !lower.includes('valor') && 
            !lower.includes('total') &&
            !/^\d{2}\/\d{2}/.test(line) &&
            !lower.includes('comprovante') &&
            !lower.includes('pix') &&
            line.length < 60) {
          description = line.trim();
          break;
        }
      }
      return { amount, date, description, rawText: fullText };
    } catch (error) {
      console.warn('[OCR] Erro:', error);
      throw error;
    }
  };

  const handleScan = async (source) => {
    try {
      const permissionResult = source === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(t('ocr.permissionDenied'), t('ocr.permissionDesc'));
        return;
      }

      setLoading(true);

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          });

      if (result.canceled || !result.assets?.[0]?.base64) {
        setLoading(false);
        return;
      }

      const base64Image = result.assets[0].base64;
      const extracted = await processImage(base64Image);

      setLoading(false);

      if (!extracted || (!extracted.amount && !extracted.date)) {
        Alert.alert(
          t('ocr.notFound'),
          t('ocr.notFoundDesc'),
          [{ text: 'OK' }]
        );
        return;
      }

      onResult(extracted);
      onClose();

    } catch (error) {
      setLoading(false);
      Alert.alert(t('ocr.error'), error.message || t('ocr.errorDesc'));
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.bgCard }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              <Ionicons name="scan" size={22} color={colors.primary} />  {t('ocr.title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {t('ocr.desc')}
          </Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                {t('ocr.processing')}
              </Text>
            </View>
          ) : (
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleScan('camera')}
              >
                <Ionicons name="camera" size={28} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>{t('ocr.camera')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.bgTertiary, borderWidth: 1.5, borderColor: colors.border }]}
                onPress={() => handleScan('gallery')}
              >
                <Ionicons name="images" size={28} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>{t('ocr.gallery')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.tip, { color: colors.textMuted }]}>
            {t('ocr.tip')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    gap: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tip: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default OCRScanner;