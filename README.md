# SmartExpense — Finanças Pessoais com Círculos Compartilhados

Aplicativo de controle financeiro pessoal e compartilhado em React Native com Expo SDK 56. Gerencie cartões, transações, metas e compartilhe dados financeiros com familiares e amigos em tempo real via Supabase.

---

## 🚀 Como executar

### 1. Instalar dependências
```bash
cd SmartExpense
npm install
```

### 2. Iniciar no Expo Go
```bash
npx expo start
```

Escaneie o QR code com o app **Expo Go** no seu celular.

---

## 📱 Funcionalidades

### 💰 Finanças Pessoais
- **Dashboard** com resumo financeiro, saldo em caixa, gráficos de pizza e barras
- **Transações** — adicione receitas e despesas com categorias coloridas, tags e formas de pagamento (cartão, Pix, boleto, dinheiro)
- **Cartões de crédito** — controle de limite, faturas, vencimento e fechamento, com 2 modos de visualização (cartão visual ou lista compacta)
- **Metas financeiras** — crie metas com 171 ícones, acompanhe progresso com barra animada, invista e retire valores
- **Boletos pendentes** — seção dedicada com botão "Quitar" que deduz do caixa automaticamente
- **Exportar/Importar dados** em JSON

### 🔄 Círculos Financeiros (Compartilhamento)
- **Crie círculos** para compartilhar dados com família, amigos ou equipes
- **Convide por código** ou link
- **Permissões granulares** — controle quem pode editar ou apenas visualizar cada item
- **Sincronização em tempo real** via Supabase subscriptions
- **Dados unificados** — visualize cartões, transações e metas locais + compartilhados em uma única tela
- **Log de atividade** com notificações de quem fez o quê

### 🎨 Personalização
- **10 temas de cores** — Roxo, Azul, Verde, Vermelho, Laranja, Rosa, Turquesa, Índigo, Grafite, Âmbar
- **Modo escuro/claro** automático ou manual
- **3 idiomas** — Português, Inglês, Espanhol
- **Categorias personalizadas** com 171 ícones e 12 cores

### 🔊 Feedback
- Sons personalizados (adicionar, excluir, notificação, conquista) via `expo-audio`
- Haptic feedback em interações
- Toast notifications animadas

### 🏦 Bancos
- **180 bancos brasileiros** cadastrados (códigos COMPE 001–757)
- Seleção por nome, código ou busca
- Inclui: Nubank, Inter, C6, Next, Banco do Brasil, Bradesco, Itaú, Caixa, Santander, BNDES, XP, BS2, Neon, PicPay, Mercado Pago, PagBank, Stone, Crefisa, Safra, Banrisul, Sicredi, Sicoob e muitos outros

---

## 🛡️ Segurança

- Credenciais Supabase via variáveis de ambiente (não hardcoded)
- Hash de senha com `expo-crypto` (SHA-256)
- Row Level Security (RLS) no Supabase
- Validação de dados no import JSON
- Rate limiting em autenticação

---

## 🔧 Build para produção

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Build Android (APK)
eas build --platform android --profile preview

# Build iOS (requer conta Apple Developer)
eas build --platform ios
```

---

## 🌐 Repositório

[github.com/SamuK-Code/SmartExpense](https://github.com/SamuK-Code/SmartExpense)

---

## 📄 Licença

MIT
