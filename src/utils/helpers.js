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

export const getCardGradientColors = (gradientClass) => {
  const gradients = {
    'card-gradient-purple': ['#8B5CF6', '#7C3AED', '#6D28D9'],
    'card-gradient-blue': ['#3B82F6', '#2563EB', '#1D4ED8'],
    'card-gradient-green': ['#10B981', '#059669', '#047857'],
    'card-gradient-red': ['#EF4444', '#DC2626', '#B91C1C'],
    'card-gradient-orange': ['#F59E0B', '#D97706', '#B45309'],
    'card-gradient-pink': ['#EC4899', '#DB2777', '#BE185D'],
    'card-gradient-teal': ['#14B8A6', '#0D9488', '#0F766E'],
    'card-gradient-indigo': ['#6366F1', '#4F46E5', '#4338CA'],
    'card-gradient-rose': ['#FB7185', '#E11D48', '#BE123C'],
    'card-gradient-cyan': ['#06B6D4', '#0891B2', '#0E7490'],
    'card-gradient-emerald': ['#34D399', '#10B981', '#059669'],
    'card-gradient-violet': ['#A78BFA', '#8B5CF6', '#7C3AED'],
  };
  return gradients[gradientClass] || gradients['card-gradient-purple'];
};
