import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString + 'T00:00:00'), 'dd/MM', { locale: ptBR });
  } catch {
    return dateString;
  }
};

export const formatDateFull = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
};

export const getMonthYear = () => {
  return format(new Date(), 'MMMM yyyy', { locale: ptBR });
};

export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

export const getDaysLeft = (deadline) => {
  const today = new Date();
  const due = new Date(deadline);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

// ═══════════════════════════════════════════════════════════
// 🎨 20 OPÇÕES DE GRADIENTES/SÓLIDOS/TEMPLATES PARA CARTÕES
// ═══════════════════════════════════════════════════════════

export const getCardGradientColors = (gradientClass) => {
  const gradients = {
    // ═══════ GRADIENTES (15 opções) ═══════

    // 1. ROXO REAL — Deep Violet → Magenta
    'card-gradient-purple': ['#4C1D95', '#7C3AED', '#A855F7'],

    // 2. AZUL OCEANO — Navy → Ciano Elétrico
    'card-gradient-blue': ['#0C4A6E', '#0369A1', '#06B6D4'],

    // 3. VERDE FLORESTA — Esmeralda Escuro → Lima Neon
    'card-gradient-green': ['#064E3B', '#059669', '#34D399'],

    // 4. VERMELHO FÚRIA — Vinho → Coral Ardente
    'card-gradient-red': ['#7F1D1D', '#DC2626', '#FB7185'],

    // 5. LARANJA SOL — Âmbar → Pêssego
    'card-gradient-orange': ['#7C2D12', '#EA580C', '#FDBA74'],

    // 6. ROSA CHOQUE — Fúcsia → Rosa Bebê
    'card-gradient-pink': ['#831843', '#DB2777', '#F9A8D4'],

    // 7. CIANO GLACIAL — Petróleo → Turquesa
    'card-gradient-cyan': ['#134E4A', '#0D9488', '#5EEAD4'],

    // 8. LIMA ELÉTRICO — Musgo → Lima Neon
    'card-gradient-lime': ['#3F6212', '#65A30D', '#BEF264'],

    // 9. HOLOGRÁFICO — Lilás → Menta → Azul Céu
    'card-gradient-holo': ['#8B5CF6', '#C084FC', '#F0ABFC', '#67E8F9'],

    // 10. DARK PREMIUM — Grafite → Roxo Neon → Magenta
    'card-gradient-dark': ['#18181B', '#3F3F46', '#7C3AED', '#D946EF'],

    // 11. SYNTHWAVE — Magenta → Roxo → Ciano
    'card-gradient-synth': ['#BE185D', '#7C3AED', '#0891B2'],

    // 12. SUNSET — Bordô → Laranja → Dourado
    'card-gradient-sunset': ['#881337', '#C2410C', '#F59E0B'],

    // 13. MIDNIGHT — Azul profundo → Índigo → Violeta
    'card-gradient-midnight': ['#1E1B4B', '#4338CA', '#7C3AED'],

    // 14. AURORA — Verde água → Azul celeste → Rosa
    'card-gradient-aurora': ['#0F766E', '#0EA5E9', '#F472B6'],

    // 15. FOGO — Vermelho sangue → Laranja → Amarelo
    'card-gradient-fire': ['#991B1B', '#EA580C', '#FACC15'],

    // ═══════ CORES SÓLIDAS (3 opções) ═══════

    // 16. PRETO FOSCO — Cor única, elegante
    'card-solid-black': ['#1C1917', '#1C1917', '#1C1917'],

    // 17. BRANCO PEROLA — Minimalista e clean
    'card-solid-white': ['#F5F5F4', '#F5F5F4', '#F5F5F4'],

    // 18. DOURADO METÁLICO — Luxo puro
    'card-solid-gold': ['#D4AF37', '#D4AF37', '#D4AF37'],

    // ═══════ TEMPLATES COM IMAGEM (6 opções) ═══════
    // Estes retornam null para cores — o CreditCard.js usará ImageBackground

    // 19. TEMPLATE PREMIUM DARK — Fundo escuro com padrão
    'card-template-dark': null,

	// 20. TEMPLATE GOLD — Fundo dourado metálico
    'card-template-color': null,

    // 20. TEMPLATE GOLD — Fundo dourado metálico
    'card-template-gold': null,

    // 21. TEMPLATE HOLOGRAPHIC — Arco-íris holográfico
    'card-template-holo': null,

    // 22. TEMPLATE CARBON — Fibra de carbono
    'card-template-carbon': null,

    // 23. TEMPLATE MARBLE — Mármore branco elegante
    'card-template-marble': null,

    // 24. TEMPLATE GLASS — Glassmorphism / Frosted
    'card-template-glass': null,
  };

  return gradients[gradientClass] || gradients['card-gradient-purple'];
};

// Verifica se o gradiente é do tipo imagem (template)
export const isCardTemplate = (gradientClass) => {
  return gradientClass?.startsWith('card-template-');
};

// Verifica se o gradiente é cor sólida
export const isCardSolid = (gradientClass) => {
  return gradientClass?.startsWith('card-solid-');
};

// Verifica se é gradiente normal
export const isCardGradient = (gradientClass) => {
  return gradientClass?.startsWith('card-gradient-');
};

// Retorna a imagem de template via require() local
// Coloque as imagens em: assets/images/card-template-*.png
export const getCardTemplateImage = (gradientClass) => {
  const templates = {
    'card-template-dark':   require('../../assets/images/card-template-dark.png'),
    'card-template-color':   require('../../assets/images/card-template-color.png'),
	'card-template-gold':   require('../../assets/images/card-template-gold.png'),
    'card-template-holo':   require('../../assets/images/card-template-holo.png'),
    'card-template-carbon': require('../../assets/images/card-template-carbon.png'),
    'card-template-marble': require('../../assets/images/card-template-marble.png'),
    'card-template-glass':  require('../../assets/images/card-template-glass.png'),
  };
  return templates[gradientClass] || null;
};