// OCRScanner.js — Scanner de Comprovantes (OCR)
// Extrai valor e data de comprovantes sem salvar a imagem
// Requer: API Key do Google Cloud Vision (gratuita até 1000 requests/mês)

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import { GOOGLE_VISION_API_KEY } from '../config/env';

const OCRScanner = ({ onResult, onClose, visible }) => {
  const { colors } = useTheme();
  const { t } = useTranslate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const hasApiKey = GOOGLE_VISION_API_KEY.length > 10;

  const extractValue = (text) => {
    // Padrões comuns de valor monetário em comprovantes brasileiros
    const patterns = [
      /R\$\s*([\d.]+),\d{2}/gi,           // R$ 1.234,56
      /R\$\s*([\d.]+)\.(\d{2})/gi,        // R$ 1.234.56
      /VALOR[\s:]*R\$\s*([\d.,]+)/gi,     // VALOR: R$ 1.234,56
      /TOTAL[\s:]*R\$\s*([\d.,]+)/gi,     // TOTAL: R$ 1.234,56
      /R\$\s*([\d.,]+)/gi,                // R$ qualquer valor
      /([\d.]+),\d{2}\s*reais/gi,         // 1.234,56 reais
      /([\d.]+)\.(\d{2})/g,               // 1234.56 (formato americano)
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
      // DD/MM/YYYY ou DD/MM/YY
      /(\d{2})\/(\d{2})\/(\d{4})/g,
      /(\d{2})\/(\d{2})\/(\d{2})/g,
      // DD-MM-YYYY
      /(\d{2})-(\d{2})-(\d{4})/g,
      // YYYY-MM-DD (ISO)
      /(\d{4})-(\d{2})-(\d{2})/g,
      // Texto: 15 de janeiro de 2024
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
          // Formato textual
          day = parseInt(match[1]);
          month = monthsPt[match[2].toLowerCase()];
          year = parseInt(match[3]);
        } else if (match[0].includes('-') && match[1].length === 4) {
          // ISO YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          // DD/MM/YYYY
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

  const callGoogleVision = async (base64Image) => {
    const body = {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      }],
    };

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (result.responses?.[0]?.error) {
      throw new Error(result.responses[0].error.message);
    }

    return result.responses?.[0]?.textAnnotations?.[0]?.description || '';
  };

  const processImage = async (base64Image) => {
    try {
      const fullText = await callGoogleVision(base64Image);

      if (!fullText) {
        return null;
      }

      const amount = extractValue(fullText);
      const date = extractDate(fullText);

      // Tentar extrair descrição (primeira linha que não seja data/valor)
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
    if (!hasApiKey) {
      Alert.alert(
        t('ocr.apiKeyRequired'),
        t('ocr.apiKeyDesc'),
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              <Ionicons name="scan" size={22} color={colors.primary} />  {t('ocr.title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {!hasApiKey && (
            <View style={[styles.warningBox, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {t('ocr.apiKeyRequired')}
              </Text>
              <Text style={[styles.warningSub, { color: colors.textMuted }]}>
                {t('ocr.apiKeySetup')}
              </Text>
            </View>
          )}

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

  warningBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  warningSub: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

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
export { GOOGLE_VISION_API_KEY };