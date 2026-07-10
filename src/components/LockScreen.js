// LockScreen.js — Versão minimalista e robusta
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Vibration,
  Dimensions, StatusBar, BackHandler
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslate } from '../hooks/useTranslate';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const SCREEN_W = Dimensions.get('window').width;
const PIN_LEN = 4;

export default function LockScreen({ onUnlock, onDevMode }) {
  const { colors } = useTheme();
  const { t } = useTranslate();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [bioAvail, setBioAvail] = useState(false);
  const [bioType, setBioType] = useState(null);

  const shake = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
    checkBio();
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, []);

  async function checkBio() {
    try {
      const hw = await LocalAuthentication.hasHardwareAsync();
      if (!hw) return;
      const en = await LocalAuthentication.isEnrolledAsync();
      if (!en) return;
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBioAvail(true);
      if (types.includes(2)) setBioType('face');
      else if (types.includes(1)) setBioType('fingerprint');
      else setBioType('biometric');
    } catch (e) { setBioAvail(false); }
  }

  function doShake() {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shake, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function tryBio() {
    try {
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: t('lock.biometricPrompt'),
        fallbackLabel: t('lock.usePin'),
        cancelLabel: t('common.cancel'),
        disableDeviceFallback: false,
      });
      if (r.success) doUnlock();
    } catch (e) {}
  }

  async function tryPin(entered) {
    try {
      // 🔓 Senha de desenvolvedor: ativa modo dev
      if (entered === '2024') {
        setPin(''); setErr(false);
        if (onDevMode) onDevMode();
        doUnlock();
        return;
      }

      const stored = await SecureStore.getItemAsync('smartexpense_pin');
      if (stored === entered) {
        setPin(''); setErr(false);
        doUnlock();
      } else {
        setPin(''); setErr(true); doShake();
        setTimeout(() => setErr(false), 2000);
      }
    } catch (e) {
      setPin(''); setErr(true); doShake();
    }
  }

  function doUnlock() {
    Animated.timing(fade, {
      toValue: 0, duration: 250, useNativeDriver: true,
    }).start(() => onUnlock());
  }

  function pressNum(n) {
    if (err) setErr(false);
    if (pin.length >= PIN_LEN) return;
    const np = pin + n;
    setPin(np);
    if (np.length === PIN_LEN) {
      setTimeout(() => tryPin(np), 120);
    }
  }

  function pressDel() {
    if (err) setErr(false);
    setPin(p => p.slice(0, -1));
  }

  function bioIcon() {
    if (bioType === 'face') return 'scan-outline';
    if (bioType === 'fingerprint') return 'finger-print';
    return 'scan';
  }

  // ─── RENDER ───
  return (
    <Animated.View style={[S.wrap, { opacity: fade }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      <View style={S.bg} />

      <View style={S.center}>
        {/* Ícone */}
        <View style={[S.lockCircle, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
        </View>

        {/* Títulos */}
        <Text style={S.title}>{t('lock.title')}</Text>
        <Text style={S.sub}>{t('lock.enterPin')}</Text>

        {/* Dots */}
        <Animated.View style={[S.dotsRow, { transform: [{ translateX: shake }] }]}>
          {[0,1,2,3].map(i => {
            const filled = i < pin.length;
            return (
              <View key={i} style={[S.dot, {
                borderColor: err ? '#EF4444' : filled ? colors.primary : 'rgba(255,255,255,0.3)',
                backgroundColor: filled ? (err ? '#EF4444' : colors.primary) : 'transparent',
              }]} />
            );
          })}
        </Animated.View>

        {/* Erro */}
        <View style={S.errBox}>
          {err && <Text style={S.errText}>{t('lock.wrongPin')}</Text>}
        </View>

        {/* Teclado — 3 colunas fixas */}
        <View style={S.padWrap}>
          <View style={S.pad}>
            {/* Linha 1 */}
            <View style={S.row}>
              <TouchableOpacity style={S.key} onPress={() => pressNum('1')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('2')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('3')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>3</Text>
              </TouchableOpacity>
            </View>
            {/* Linha 2 */}
            <View style={S.row}>
              <TouchableOpacity style={S.key} onPress={() => pressNum('4')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('5')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('6')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>6</Text>
              </TouchableOpacity>
            </View>
            {/* Linha 3 */}
            <View style={S.row}>
              <TouchableOpacity style={S.key} onPress={() => pressNum('7')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('8')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={() => pressNum('9')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>9</Text>
              </TouchableOpacity>
            </View>
            {/* Linha 4 */}
            <View style={S.row}>
              <View style={S.key} />
              <TouchableOpacity style={S.key} onPress={() => pressNum('0')} activeOpacity={0.6}>
                <Text style={S.keyTxt}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.key} onPress={pressDel} activeOpacity={0.6}>
                <Ionicons name="backspace-outline" size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Biometria */}
        {bioAvail && (
          <TouchableOpacity style={S.bioBtn} onPress={tryBio} activeOpacity={0.7}>
            <Ionicons name={bioIcon()} size={28} color={colors.primary} />
            <Text style={[S.bioTxt, { color: colors.primary }]}>{t('lock.useBiometric')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ─── ESTILOS FIXOS (sem cálculos dinâmicos problemáticos) ───
const PAD_W = 288; // largura fixa do teclado
const KEY_W = 80;  // largura fixa de cada botão

const S = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  bg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0B1120',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockCircle: {
    width: 64, height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20, fontWeight: '700',
    color: '#FFFFFF', marginBottom: 6,
  },
  sub: {
    fontSize: 14, fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 16, height: 16,
    borderRadius: 8, borderWidth: 2,
  },
  errBox: {
    height: 22, marginBottom: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  errText: {
    fontSize: 14, fontWeight: '600', color: '#EF4444',
  },
  padWrap: {
    alignItems: 'center',
  },
  pad: {
    width: PAD_W,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PAD_W,
  },
  key: {
    width: KEY_W, height: KEY_W,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: KEY_W / 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  keyTxt: {
    fontSize: 26, fontWeight: '400', color: '#FFFFFF',
  },
  bioBtn: {
    marginTop: 28,
    alignItems: 'center', gap: 6,
  },
  bioTxt: {
    fontSize: 13, fontWeight: '600',
  },
});