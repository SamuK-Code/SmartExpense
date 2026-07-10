import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ========== BANCOS BRASILEIROS ==========
// Exportado para uso em CardsScreen.js e outros componentes
export const BRAZILIAN_BANKS = [
  { code: '001', name: 'Banco do Brasil', shortName: 'Banco do Brasil' },
  { code: '003', name: 'Banco da Amazônia', shortName: 'Basa' },
  { code: '004', name: 'Banco do Nordeste', shortName: 'BNB' },
  { code: '007', name: 'BNDES', shortName: 'BNDES' },
  { code: '012', name: 'Banco Inbursa', shortName: 'Inbursa' },
  { code: '018', name: 'Banco Tricury', shortName: 'Tricury' },
  { code: '021', name: 'Banestes', shortName: 'Banestes' },
  { code: '025', name: 'Banco Alfa', shortName: 'Alfa' },
  { code: '029', name: 'Banco Itaú Consignado', shortName: 'Itaú Consig' },
  { code: '031', name: 'Banco Beg', shortName: 'Beg' },
  { code: '033', name: 'Santander', shortName: 'Santander' },
  { code: '036', name: 'Banco Bradesco BBI', shortName: 'Bradesco BBI' },
  { code: '037', name: 'Banco do Estado do Pará', shortName: 'Banpará' },
  { code: '040', name: 'Banco Cargill', shortName: 'Cargill' },
  { code: '041', name: 'Banrisul', shortName: 'Banrisul' },
  { code: '045', name: 'Banco Opportunity', shortName: 'Opportunity' },
  { code: '047', name: 'Banese', shortName: 'Banese' },
  { code: '051', name: 'Banco de Desenvolvimento do Espírito Santo', shortName: 'Bandes' },
  { code: '063', name: 'Banco Bradescard', shortName: 'Bradescard' },
  { code: '064', name: 'Goldman Sachs', shortName: 'Goldman Sachs' },
  { code: '065', name: 'Banco Andbank', shortName: 'Andbank' },
  { code: '066', name: 'Banco Morgan Stanley', shortName: 'Morgan Stanley' },
  { code: '069', name: 'Banco Crefisa', shortName: 'Crefisa' },
  { code: '070', name: 'Banco de Brasília (BRB)', shortName: 'BRB' },
  { code: '074', name: 'Banco J. Safra', shortName: 'Safra Digital' },
  { code: '075', name: 'Banco ABN AMRO', shortName: 'ABN AMRO' },
  { code: '076', name: 'Banco KDB', shortName: 'KDB' },
  { code: '077', name: 'Banco Inter', shortName: 'Inter' },
  { code: '079', name: 'Banco Original do Agronegócio', shortName: 'Original Agro' },
  { code: '082', name: 'Banco Topázio', shortName: 'Topázio' },
  { code: '083', name: 'Banco da China Brasil', shortName: 'China Brasil' },
  { code: '088', name: 'Banco Randon', shortName: 'Randon' },
  { code: '091', name: 'Unicred', shortName: 'Unicred' },
  { code: '094', name: 'Banco Finaxis', shortName: 'Finaxis' },
  { code: '096', name: 'Banco B3', shortName: 'B3' },
  { code: '102', name: 'XP Investimentos', shortName: 'XP' },
  { code: '104', name: 'Caixa Econômica Federal', shortName: 'Caixa' },
  { code: '107', name: 'Banco Bocom BBM', shortName: 'Bocom BBM' },
  { code: '117', name: 'Advanced Cc', shortName: 'Advanced' },
  { code: '119', name: 'Banco Western Union', shortName: 'Western Union' },
  { code: '120', name: 'Banco Rodobens', shortName: 'Rodobens' },
  { code: '121', name: 'Agibank', shortName: 'Agibank' },
  { code: '122', name: 'Banco Bradesco BERJ', shortName: 'Bradesco BERJ' },
  { code: '124', name: 'Banco Woori Bank', shortName: 'Woori Bank' },
  { code: '128', name: 'MS Bank', shortName: 'MS Bank' },
  { code: '129', name: 'UBS Brasil', shortName: 'UBS' },
  { code: '136', name: 'Unicred Cooperativa', shortName: 'Unicred Coop' },
  { code: '142', name: 'Broker Brasil', shortName: 'Broker' },
  { code: '143', name: 'Treviso Cc', shortName: 'Treviso' },
  { code: '144', name: 'Bexs Banco', shortName: 'Bexs' },
  { code: '159', name: 'Casa Credito', shortName: 'Casa Crédito' },
  { code: '169', name: 'Banco Olé Consignado', shortName: 'Olé' },
  { code: '172', name: 'Albatross Ccv', shortName: 'Albatross' },
  { code: '173', name: 'BRL Trust', shortName: 'BRL Trust' },
  { code: '184', name: 'Banco Itaú BBA', shortName: 'Itaú BBA' },
  { code: '188', name: 'Ativa Investimentos', shortName: 'Ativa' },
  { code: '196', name: 'Banco Fair Corretora', shortName: 'Fair' },
  { code: '197', name: 'Stone', shortName: 'Stone' },
  { code: '204', name: 'Banco Bradesco Cartões', shortName: 'Bradesco Cards' },
  { code: '208', name: 'BTG Pactual', shortName: 'BTG' },
  { code: '212', name: 'Banco Original', shortName: 'Original' },
  { code: '213', name: 'Banco Arbi', shortName: 'Arbi' },
  { code: '217', name: 'Banco John Deere', shortName: 'John Deere' },
  { code: '218', name: 'Banco BS2', shortName: 'BS2' },
  { code: '222', name: 'Banco Credit Agricole', shortName: 'Credit Agricole' },
  { code: '224', name: 'Banco Fibra', shortName: 'Fibra' },
  { code: '228', name: 'Banco Itaú Consignado', shortName: 'Itaú Consig' },
  { code: '229', name: 'Banco Cruzeiro do Sul', shortName: 'Cruzeiro Sul' },
  { code: '230', name: 'Uniprime', shortName: 'Uniprime' },
  { code: '233', name: 'Banco Cifra', shortName: 'Cifra' },
  { code: '237', name: 'Bradesco', shortName: 'Bradesco' },
  { code: '237', name: 'Next', shortName: 'Next' },
  { code: '241', name: 'Banco Classico', shortName: 'Classico' },
  { code: '243', name: 'Banco Máxima', shortName: 'Máxima' },
  { code: '246', name: 'Banco ABC Brasil', shortName: 'ABC' },
  { code: '249', name: 'Banco Investcred', shortName: 'Investcred' },
  { code: '254', name: 'Paraná Banco', shortName: 'Paraná Banco' },
  { code: '260', name: 'Nubank', shortName: 'Nubank' },
  { code: '265', name: 'Banco Fator', shortName: 'Fator' },
  { code: '266', name: 'Banco Cedula', shortName: 'Cedula' },
  { code: '269', name: 'Banco HSBC', shortName: 'HSBC' },
  { code: '280', name: 'Avista S.A. Crédito', shortName: 'Avista' },
  { code: '290', name: 'PagBank', shortName: 'PagBank' },
  { code: '292', name: 'Bs2 Distribuidora', shortName: 'BS2 Dist' },
  { code: '300', name: 'Banco de La Nacion Argentina', shortName: 'La Nación' },
  { code: '306', name: 'Portopar Distribuidora', shortName: 'Portopar' },
  { code: '309', name: 'Cambionet Corretora', shortName: 'Cambionet' },
  { code: '313', name: 'Amazônia Corretora', shortName: 'Amazônia Cc' },
  { code: '315', name: 'Pi Distribuidora', shortName: 'Pi' },
  { code: '318', name: 'Banco BMG', shortName: 'BMG' },
  { code: '320', name: 'Banco Industrial e Comercial', shortName: 'BIC' },
  { code: '323', name: 'Mercado Pago', shortName: 'Mercado Pago' },
  { code: '324', name: 'Cartos Sociedade de Crédito', shortName: 'Cartos' },
  { code: '325', name: 'Órama Distribuidora', shortName: 'Órama' },
  { code: '326', name: 'Parati Crédito', shortName: 'Parati' },
  { code: '329', name: 'Qi Sociedade de Crédito', shortName: 'Qi' },
  { code: '330', name: 'Banco Bari', shortName: 'Bari' },
  { code: '335', name: 'Banco Digio', shortName: 'Digio' },
  { code: '336', name: 'C6 Bank', shortName: 'C6 Bank' },
  { code: '340', name: 'Superdigital', shortName: 'Superdigital' },
  { code: '341', name: 'Itaú Unibanco', shortName: 'Itaú' },
  { code: '348', name: 'Banco XP', shortName: 'XP' },
  { code: '349', name: 'Al5 S.A. Crédito', shortName: 'Al5' },
  { code: '354', name: 'Necton Investimentos', shortName: 'Necton' },
  { code: '355', name: 'Ótimo Sociedade de Crédito', shortName: 'Ótimo' },
  { code: '366', name: 'Banco Société Générale', shortName: 'SocGen' },
  { code: '368', name: 'Banco Carrefour', shortName: 'Carrefour' },
  { code: '370', name: 'Banco Mizuho', shortName: 'Mizuho' },
  { code: '374', name: 'Realize Crédito', shortName: 'Realize' },
  { code: '376', name: 'Banco JP Morgan', shortName: 'JP Morgan' },
  { code: '378', name: 'BBC Leasing', shortName: 'BBC' },
  { code: '380', name: 'PicPay', shortName: 'PicPay' },
  { code: '381', name: 'Banco Mercedes-Benz', shortName: 'Mercedes-Benz' },
  { code: '387', name: 'Banco Toyota', shortName: 'Toyota' },
  { code: '389', name: 'Banco Mercantil do Brasil', shortName: 'Mercantil' },
  { code: '390', name: 'Banco GM', shortName: 'GM' },
  { code: '393', name: 'Banco Volkswagen', shortName: 'Volkswagen' },
  { code: '394', name: 'Banco Bradesco Financiamentos', shortName: 'Bradesco Fin' },
  { code: '397', name: 'Listo Sociedade de Crédito', shortName: 'Listo' },
  { code: '399', name: 'Kirton Bank', shortName: 'Kirton' },
  { code: '408', name: 'Bónuscred', shortName: 'Bónuscred' },
  { code: '410', name: 'Banco Vecchio', shortName: 'Vecchio' },
  { code: '412', name: 'Banco Capital', shortName: 'Capital' },
  { code: '422', name: 'Banco Safra', shortName: 'Safra' },
  { code: '449', name: 'Dacasa Financeira', shortName: 'Dacasa' },
  { code: '453', name: 'Banco Rural', shortName: 'Rural' },
  { code: '456', name: 'Banco MUFG Brasil', shortName: 'MUFG' },
  { code: '464', name: 'Banco Sumitomo Mitsui', shortName: 'Sumitomo' },
  { code: '473', name: 'Banco Caixa Geral', shortName: 'Caixa Geral' },
  { code: '477', name: 'Citibank N.A.', shortName: 'Citibank NA' },
  { code: '479', name: 'Banco Itaubank', shortName: 'Itaubank' },
  { code: '487', name: 'Deutsche Bank', shortName: 'Deutsche' },
  { code: '488', name: 'JPMorgan Chase Bank', shortName: 'JPMorgan' },
  { code: '492', name: 'ING Bank', shortName: 'ING' },
  { code: '494', name: 'Banco de La República', shortName: 'República' },
  { code: '495', name: 'Banco de La Provincia', shortName: 'Provincia' },
  { code: '505', name: 'Banco Credit Suisse', shortName: 'Credit Suisse' },
  { code: '533', name: 'Will Bank', shortName: 'Will' },
  { code: '545', name: 'Banco Senso Ccvm', shortName: 'Senso' },
  { code: '600', name: 'Banco Luso Brasileiro', shortName: 'Luso' },
  { code: '604', name: 'Banco Industrial do Brasil', shortName: 'Industrial' },
  { code: '610', name: 'Banco VR', shortName: 'VR' },
  { code: '611', name: 'Banco Paulista', shortName: 'Paulista' },
  { code: '612', name: 'Banco Guanabara', shortName: 'Guanabara' },
  { code: '613', name: 'Banco Pecúnia', shortName: 'Pecúnia' },
  { code: '623', name: 'Banco PAN', shortName: 'PAN' },
  { code: '626', name: 'Banco Ficsa', shortName: 'Ficsa' },
  { code: '630', name: 'Banco Smartbank', shortName: 'Smartbank' },
  { code: '633', name: 'Banco Rendimento', shortName: 'Rendimento' },
  { code: '634', name: 'Banco Triângulo', shortName: 'Triângulo' },
  { code: '637', name: 'Banco Sofisa', shortName: 'Sofisa' },
  { code: '638', name: 'Banco Prosper', shortName: 'Prosper' },
  { code: '641', name: 'Banco Alvorada', shortName: 'Alvorada' },
  { code: '643', name: 'Banco Pine', shortName: 'Pine' },
  { code: '652', name: 'Itaú Unibanco Holding', shortName: 'Itaú Hold' },
  { code: '653', name: 'Banco Indusval', shortName: 'Indusval' },
  { code: '654', name: 'Banco A.J. Renner', shortName: 'Renner' },
  { code: '655', name: 'Banco Votorantim', shortName: 'BV' },
  { code: '707', name: 'Banco Daycoval', shortName: 'Daycoval' },
  { code: '712', name: 'Banco Ourinvest', shortName: 'Ourinvest' },
  { code: '719', name: 'Banco Banif', shortName: 'Banif' },
  { code: '720', name: 'Banco Maxinvest', shortName: 'Maxinvest' },
  { code: '721', name: 'Banco Credibel', shortName: 'Credibel' },
  { code: '734', name: 'Banco Gerdau', shortName: 'Gerdau' },
  { code: '735', name: 'Neon', shortName: 'Neon' },
  { code: '739', name: 'Banco Cetelem', shortName: 'Cetelem' },
  { code: '740', name: 'Banco Barclays', shortName: 'Barclays' },
  { code: '741', name: 'Banco Ribeirão Preto', shortName: 'Ribeirão Preto' },
  { code: '743', name: 'Banco Semear', shortName: 'Semear' },
  { code: '745', name: 'Citibank', shortName: 'Citi' },
  { code: '746', name: 'Banco Modal', shortName: 'Modal' },
  { code: '747', name: 'Banco Rabobank', shortName: 'Rabobank' },
  { code: '748', name: 'Sicredi', shortName: 'Sicredi' },
  { code: '751', name: 'Banco Scotiabank', shortName: 'Scotiabank' },
  { code: '752', name: 'Banco BNP Paribas', shortName: 'BNP' },
  { code: '753', name: 'NBC Bank Brasil', shortName: 'NBC' },
  { code: '754', name: 'Banco Sistema', shortName: 'Sistema' },
  { code: '755', name: 'Bank of America Merrill Lynch', shortName: 'BoA' },
  { code: '756', name: 'Sicoob', shortName: 'Sicoob' },
  { code: '757', name: 'Banco Keb Hana', shortName: 'Keb Hana' }
];

// ======== Ícones ===============
export const GOAL_ICONS = [
  'airplane', 'alarm', 'american-football', 'aperture', 'archive', 'barbell',
  'basket', 'basketball', 'bed', 'beer', 'bicycle', 'boat', 'book', 'briefcase',
  'brush', 'bug', 'build', 'bus', 'cafe', 'camera', 'car', 'card', 'cart',
  'cash', 'cellular', 'chatbubble', 'checkmark-circle', 'clipboard', 'clock',
  'cloud', 'code', 'color-palette', 'compass', 'construct', 'cube', 'desktop',
  'diamond', 'document', 'earth', 'egg', 'extension-puzzle', 'eye', 'female',
  'film', 'filter', 'finger-print', 'fish', 'fitness', 'flag', 'flame',
  'flash', 'flashlight', 'flower', 'football', 'game-controller', 'gift',
  'glasses', 'globe', 'golf', 'grid', 'hammer', 'happy', 'headset', 'heart',
  'home', 'ice-cream', 'image', 'key', 'laptop', 'leaf', 'library', 'link',
  'list', 'location', 'lock-closed', 'log-in', 'logo-apple', 'logo-bitcoin',
  'logo-css3', 'logo-docker', 'logo-figma', 'logo-firebase', 'logo-github',
  'logo-google', 'logo-html5', 'logo-javascript', 'logo-nodejs', 'logo-npm',
  'logo-python', 'logo-react', 'logo-stackoverflow', 'logo-tux', 'logo-vue',
  'logo-youtube', 'magnet', 'mail', 'male', 'map', 'medal', 'medical', 'megaphone',
  'mic', 'moon', 'musical-note', 'navigate', 'notifications', 'nuclear',
  'nutrition', 'paper-plane', 'partly-sunny', 'paw', 'pencil', 'people',
  'person', 'phone-portrait', 'pie-chart', 'pin', 'pizza', 'planet', 'pricetag',
  'print', 'pulse', 'push', 'radio', 'rainy', 'receipt', 'restaurant', 'ribbon',
  'rocket', 'rose', 'school', 'search', 'send', 'settings', 'shield-checkmark',
  'shirt', 'snow', 'sparkles', 'speedometer', 'star', 'stopwatch', 'storefront',
  'subway', 'sunny', 'sync', 'tennisball', 'terminal', 'thermometer', 'thumbs-up',
  'thunderstorm', 'ticket', 'time', 'timer', 'today', 'trail-sign', 'train',
  'transgender', 'trash', 'trending-up', 'trophy', 'tv', 'umbrella', 'videocam',
  'volume-high', 'walk', 'wallet', 'warning', 'watch', 'water', 'wifi', 'wine',
];

// ========== FORMATAÇÃO DE MOEDA ==========
export const formatCurrencyInput = (value) => {
  let cleaned = value.replace(/[^\d.,]/g, '');
  let normalized = cleaned.replace(',', '.');
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }
  const displayValue = normalized.replace('.', ',');
  return displayValue;
};

export const parseCurrencyToNumber = (value) => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
};

// ========== FORMATAÇÃO DE DATA ==========
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    return format(date, 'dd/MM', { locale: ptBR });
  } catch {
    return dateString;
  }
};

export const formatDateFull = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
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
  return format(new Date(), "MMMM yyyy", { locale: ptBR });
};

export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

export const getDaysLeft = (deadline) => {
  const today = new Date();
  const due = new Date(deadline);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

export const isAfterClosingDate = (purchaseDateStr, closingDay) => {
  if (!closingDay || !purchaseDateStr) return false;

  const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const closingDate = new Date(currentYear, currentMonth, parseInt(closingDay), 0, 0, 0);

  if (purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear) {
    return purchaseDate.getDate() > closingDate.getDate();
  }

  return false;
};

export const getDueDate = (closingDay, monthsAhead = 0) => {
  if (!closingDay) return null;

  const today = new Date();
  const targetMonth = today.getMonth() + monthsAhead;
  const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;

  const dueDate = new Date(targetYear, month, parseInt(closingDay) + 7);

  return dueDate.toISOString().split('T')[0];
};

export const getClosingDate = (closingDay, monthsAhead = 0) => {
  if (!closingDay) return null;

  const today = new Date();
  const targetMonth = today.getMonth() + monthsAhead;
  const targetYear = today.getFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;

  return new Date(targetYear, month, parseInt(closingDay)).toISOString().split('T')[0];
};

export const getDaysUntilClosing = (closingDay) => {
  if (!closingDay) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let closingDate;

  if (currentDay > parseInt(closingDay)) {
    closingDate = new Date(currentYear, currentMonth + 1, parseInt(closingDay));
  } else {
    closingDate = new Date(currentYear, currentMonth, parseInt(closingDay));
  }

  const diffMs = closingDate - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getInvoiceMonth = (purchaseDateStr, closingDay) => {
  if (!closingDay || !purchaseDateStr) return getCurrentMonth();

  const purchaseDate = new Date(purchaseDateStr + 'T00:00:00');
  const purchaseDay = purchaseDate.getDate();
  const purchaseMonth = purchaseDate.getMonth();
  const purchaseYear = purchaseDate.getFullYear();

  if (purchaseDay > parseInt(closingDay)) {
    const nextMonth = purchaseMonth + 1;
    const nextYear = purchaseYear + Math.floor(nextMonth / 12);
    const finalMonth = nextMonth % 12;
    return `${nextYear}-${String(finalMonth + 1).padStart(2, '0')}`;
  }

  return `${purchaseYear}-${String(purchaseMonth + 1).padStart(2, '0')}`;
};

export const formatInvoiceMonth = (invoiceMonthStr) => {
  if (!invoiceMonthStr) return '';
  const [year, month] = invoiceMonthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
};

// ========== CARTÕES ==========
export const getCardGradientColors = (gradientClass) => {
  const gradients = {
    'card-gradient-purple': ['#4C1D95', '#7C3AED', '#A855F7'],
    'card-gradient-blue': ['#0C4A6E', '#0369A1', '#06B6D4'],
    'card-gradient-green': ['#064E3B', '#059669', '#34D399'],
    'card-gradient-red': ['#7F1D1D', '#DC2626', '#FB7185'],
    'card-gradient-orange': ['#7C2D12', '#EA580C', '#FDBA74'],
    'card-gradient-pink': ['#831843', '#DB2777', '#F9A8D4'],
    'card-gradient-cyan': ['#134E4A', '#0D9488', '#5EEAD4'],
    'card-gradient-lime': ['#3F6212', '#65A30D', '#BEF264'],
    'card-gradient-holo': ['#8B5CF6', '#C084FC', '#F0ABFC', '#67E8F9'],
    'card-gradient-dark': ['#18181B', '#3F3F46', '#7C3AED', '#D946EF'],
    'card-gradient-synth': ['#BE185D', '#7C3AED', '#0891B2'],
    'card-gradient-sunset': ['#881337', '#C2410C', '#F59E0B'],
    'card-gradient-midnight': ['#1E1B4B', '#4338CA', '#7C3AED'],
    'card-gradient-aurora': ['#0F766E', '#0EA5E9', '#F472B6'],
    'card-gradient-fire': ['#991B1B', '#EA580C', '#FACC15'],
    'card-solid-black': ['#1C1917', '#1C1917', '#1C1917'],
    'card-solid-white': ['#F5F5F4', '#F5F5F4', '#F5F5F4'],
    'card-solid-gold': ['#D4AF37', '#D4AF37', '#D4AF37'],
    'card-template-dark': null,
    'card-template-color': null,
    'card-template-gold': null,
    'card-template-holo': null,
    'card-template-carbon': null,
    'card-template-marble': null,
    'card-template-glass': null,
  };

  return gradients[gradientClass] || gradients['card-gradient-purple'];
};

export const isCardTemplate = (gradientClass) => {
  return gradientClass?.startsWith('card-template-');
};

export const isCardSolid = (gradientClass) => {
  return gradientClass?.startsWith('card-solid-');
};

export const isCardGradient = (gradientClass) => {
  return gradientClass?.startsWith('card-gradient-');
};

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