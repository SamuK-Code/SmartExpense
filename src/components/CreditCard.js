import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardGradientColors, isCardTemplate, getCardTemplateImage, isCardSolid } from '../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40; 
const CARD_HEIGHT = 185;

const CreditCard = ({ card, used = 0, compact = false }) => {
  const colors = getCardGradientColors(card.gradientClass || 'card-gradient-purple');
  const isTemplate = isCardTemplate(card.gradientClass);
  const isSolid = isCardSolid(card.gradientClass);
  const templateImage = isTemplate ? getCardTemplateImage(card.gradientClass) : null;
  const available = card.limit - used;

  const cardWidth = compact ? 290 : CARD_WIDTH;
  const cardHeight = compact ? 165 : CARD_HEIGHT;

  // Cores de texto adaptáveis
  const isLightSolid = card.gradientClass === 'card-solid-white' || card.gradientClass === 'card-solid-gold' || card.gradientClass === 'card-template-marble' || card.gradientClass === 'card-template-glass';
  const textColor = isLightSolid ? '#1C1917' : '#FFFFFF';
  const textMuted = isLightSolid ? 'rgba(28,25,23,0.65)' : 'rgba(255,255,255,0.65)';
  const chipColor = isLightSolid ? '#D4AF37' : '#ECC94B';
  const chipBorder = isLightSolid ? '#B8941F' : '#D69E2E';
  const faturaColor = isLightSolid ? '#991B1B' : '#FFE4E6';

  const formatCardNumber = (num) => {
    if (!num) return '••••  ••••  ••••  ••••';
    const cleanNum = num.replace(/\s/g, '');
    const lastFour = cleanNum.slice(-4);
    return `••••  ••••  ••••  ${lastFour}`;
  };

  const CardContent = () => (
    <View style={styles.gradient}>
      {/* Topo do Cartão: Nome do Banco e Bandeira */}
      <View style={styles.headerRow}>
        <Text style={[styles.bankName, { color: textColor }]} numberOfLines={1}>Finanças Pro</Text>
        <View style={styles.brandCircleContainer}>
          <View style={[styles.brandCircle, { backgroundColor: isLightSolid ? 'rgba(28,25,23,0.4)' : 'rgba(255,255,255,0.4)', marginRight: -10 }]} />
          <View style={[styles.brandCircle, { backgroundColor: isLightSolid ? 'rgba(28,25,23,0.25)' : 'rgba(255,255,255,0.25)' }]} />
        </View>
      </View>

      {/* Meio: Chip e Número Mascarado */}
      <View style={styles.middleRow}>
        <View style={[styles.chip, { backgroundColor: chipColor, borderColor: chipBorder }]} />
        <Text style={[styles.cardNumber, { color: textColor }]} numberOfLines={1}>
          {formatCardNumber(card.number)}
        </Text>
      </View>

      {/* Rodapé: Saldos/Limites */}
      <View style={[styles.footerRow, { borderTopColor: isLightSolid ? 'rgba(28,25,23,0.15)' : 'rgba(255, 255, 255, 0.2)' }]}>
        <View style={styles.footerColumn}>
          <Text style={[styles.footerLabel, { color: textMuted }]}>LIMITE DISPONÍVEL</Text>
          <Text style={[styles.footerValue, { color: textColor }]} numberOfLines={1}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(available)}
          </Text>
        </View>
        <View style={[styles.footerColumn, { alignItems: 'flex-end' }]}>
          <Text style={[styles.footerLabel, { color: textMuted }]}>Fatura Atual</Text>
          <Text style={[styles.footerValue, { color: faturaColor }]} numberOfLines={1}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(used)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.wrapper, { width: cardWidth, height: cardHeight }]}>
      {isTemplate && templateImage ? (
        <ImageBackground
          source={templateImage}
          style={styles.imageBackground}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.imageOverlay}>
            <CardContent />
          </View>
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0.0, y: 0.0 }}
          end={{ x: 1.0, y: 1.0 }}
          style={styles.gradient}
        >
          <CardContent />
        </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  imageBackground: {
    flex: 1,
    borderRadius: 16,
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // Overlay escuro para legibilidade
    borderRadius: 16,
  },
  gradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  brandCircleContainer: {
    flexDirection: 'row',
  },
  brandCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  middleRow: {
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 4,
    borderWidth: 0.5,
    marginBottom: 6,
  },
  cardNumber: {
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  footerColumn: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreditCard;