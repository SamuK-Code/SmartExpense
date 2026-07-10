import React, { useState, useEffect } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Keyboard,
} from 'react-native';

const isIOS = Platform.OS === 'ios';

/**
 * ModalContent
 * 
 * Wrapper cross-platform para conteúdo de modais que contém TextInput.
 * 
 * PROBLEMA: No Android, KeyboardAvoidingView dentro de Modal causa
 * flicker frenético ao tocar fora do teclado para escondê-lo.
 * 
 * SOLUÇÃO:
 * - iOS: KeyboardAvoidingView com behavior="padding" (funciona perfeitamente)
 * - Android: View + ScrollView com paddingBottom dinâmico baseado na
 *   altura real do teclado via Keyboard listeners. Sem flicker, posicionamento
 *   preciso.
 * 
 * Uso:
 * <Modal visible={...} animationType="slide" transparent>
 *   <ModalContent>
 *     <SeuConteudoAqui />
 *   </ModalContent>
 * </Modal>
 */

export const ModalContent = ({ children, style, scroll = true, scrollProps = {} }) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (isIOS) return; // iOS usa KeyboardAvoidingView, não precisa de listeners

    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const Wrapper = scroll ? ScrollView : View;
  const wrapperProps = scroll
    ? {
        keyboardShouldPersistTaps: 'handled',
        keyboardDismissMode: 'on-drag',
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [
          styles.scrollContent,
          !isIOS && { paddingBottom: keyboardHeight + 5 },
        ],
        ...scrollProps,
      }
    : {};

  if (isIOS) {
    return (
      <KeyboardAvoidingView behavior="padding" style={[styles.flex, style]}>
        <Wrapper {...wrapperProps} style={styles.flex}>
          {children}
        </Wrapper>
      </KeyboardAvoidingView>
    );
  }

  // Android: NUNCA usar KeyboardAvoidingView dentro de Modal
  // Usa paddingBottom dinâmico baseado na altura real do teclado
  return (
    <View style={[styles.flex, style]}>
      <Wrapper {...wrapperProps} style={styles.flex}>
        {children}
      </Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});

export default ModalContent;