# Finanças Pro - Expo/React Native

Versão nativa do Finanças Pro convertida para React Native com Expo SDK 52.

## 🚀 Como executar

### 1. Instalar dependências
```bash
cd financas-pro-expo
npm install
```

### 2. Iniciar no Expo Go
```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go** no seu celular.

## ⚠️ Correções aplicadas

- **Expo SDK 52** (mais estável que SDK 55)
- **Plugins removidos** do `app.json` (expo-sharing, expo-audio não precisam de config plugin)
- **expo-av** para sons (compatível com SDK 52)
- **expo-linear-gradient** para cartões com degradê
- **metro.config.js** adicionado

## 📱 Funcionalidades mantidas

- ✅ 5 telas: Início, Adicionar, Histórico, Cartões, Metas
- ✅ Navegação inferior com 5 abas
- ✅ Modo escuro/claro automático
- ✅ Gráficos interativos (Pizza e Barras)
- ✅ Cartões com degradê visual
- ✅ Sons personalizados (adicionar, excluir, notificação, conquista)
- ✅ Haptic feedback
- ✅ Exportar/Importar dados (JSON)
- ✅ Persistência local (AsyncStorage)
- ✅ Splash screen animada
- ✅ Toast notifications
- ✅ FAB menu animado
- ✅ Tags em transações
- ✅ Alertas de orçamento
- ✅ Notificações de vencimento de cartão

## 📝 Próximos Passos

1. **Adicionar sons**: Crie arquivos MP3 em `assets/sounds/` (add.mp3, delete.mp3, notif.mp3, achievement.mp3)
2. **Ícones**: Substitua `assets/icon.png` e `assets/splash.png`
3. **Build**: Use `eas build --platform android` para gerar APK

## 🔧 Build para produção

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Build Android (APK)
eas build --platform android --profile preview
```
