import { Alert } from 'react-native';

// Validation constants
export const MAX_DESCRIPTION_LENGTH = 100;
export const MAX_CATEGORY_NAME_LENGTH = 30;
export const MAX_CARD_NAME_LENGTH = 30;
export const MAX_AMOUNT = 999999.99;
export const MIN_AMOUNT = 0.01;
export const MAX_LIMIT = 999999.99;

// Email/phone regex (for future use)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitize string - remove dangerous characters
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/&/g, '&amp;')
    .trim();
};

// Validate amount
export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return { valid: false, error: 'Valor inválido' };
  if (num < MIN_AMOUNT) return { valid: false, error: `Valor mínimo: R$ ${MIN_AMOUNT.toFixed(2)}` };
  if (num > MAX_AMOUNT) return { valid: false, error: `Valor máximo: R$ ${MAX_AMOUNT.toFixed(2)}` };
  return { valid: true, value: num };
};

// Validate description
export const validateDescription = (desc) => {
  if (!desc || typeof desc !== 'string') return { valid: false, error: 'Descrição obrigatória' };
  const sanitized = sanitizeString(desc);
  if (sanitized.length === 0) return { valid: false, error: 'Descrição não pode ser vazia' };
  if (sanitized.length > MAX_DESCRIPTION_LENGTH) {
    return { valid: false, error: `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres` };
  }
  return { valid: true, value: sanitized };
};

// Validate category name
export const validateCategoryName = (name) => {
  if (!name || typeof name !== 'string') return { valid: false, error: 'Nome obrigatório' };
  const sanitized = sanitizeString(name);
  if (sanitized.length === 0) return { valid: false, error: 'Nome não pode ser vazio' };
  if (sanitized.length > MAX_CATEGORY_NAME_LENGTH) {
    return { valid: false, error: `Máximo ${MAX_CATEGORY_NAME_LENGTH} caracteres` };
  }
  return { valid: true, value: sanitized };
};

// Validate card name
export const validateCardName = (name) => {
  if (!name || typeof name !== 'string') return { valid: false, error: 'Nome obrigatório' };
  const sanitized = sanitizeString(name);
  if (sanitized.length === 0) return { valid: false, error: 'Nome não pode ser vazio' };
  if (sanitized.length > MAX_CARD_NAME_LENGTH) {
    return { valid: false, error: `Máximo ${MAX_CARD_NAME_LENGTH} caracteres` };
  }
  return { valid: true, value: sanitized };
};

// Validate limit
export const validateLimit = (limit) => {
  const num = parseFloat(limit);
  if (isNaN(num)) return { valid: false, error: 'Limite inválido' };
  if (num <= 0) return { valid: false, error: 'Limite deve ser maior que zero' };
  if (num > MAX_LIMIT) return { valid: false, error: `Limite máximo: R$ ${MAX_LIMIT.toFixed(2)}` };
  return { valid: true, value: num };
};

// Validate date
export const validateDate = (dateStr) => {
  if (!dateStr) return { valid: false, error: 'Data obrigatória' };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { valid: false, error: 'Data inválida' };

  // Check if date is not too far in future (1 year)
  const now = new Date();
  const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (date > maxDate) return { valid: false, error: 'Data não pode ser mais de 1 ano no futuro' };

  // Check if date is not too far in past (10 years)
  const minDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  if (date < minDate) return { valid: false, error: 'Data não pode ser mais de 10 anos no passado' };

  return { valid: true, value: dateStr };
};

// Check for duplicates in array
export const checkDuplicate = (array, field, value, excludeId = null) => {
  return array.some(item => {
    if (excludeId && item.id === excludeId) return false;
    return item[field]?.toLowerCase() === value?.toLowerCase();
  });
};

// Safe number parsing
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Safe integer parsing
export const safeParseInt = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Safe string access
export const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  return String(value).trim();
};

// Safe array access
export const safeArray = (value) => {
  if (!value || !Array.isArray(value)) return [];
  return value;
};

// Safe object access
export const safeObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
};

// Show validation error
export const showValidationError = (error) => {
  Alert.alert('Erro de Validação', error, [{ text: 'OK' }]);
};

// Comprehensive expense validation
export const validateExpense = (expense) => {
  const errors = [];

  // Validate amount
  const amountValidation = validateAmount(expense.amount);
  if (!amountValidation.valid) errors.push(amountValidation.error);

  // Validate description
  const descValidation = validateDescription(expense.description);
  if (!descValidation.valid) errors.push(descValidation.error);

  // Validate date
  const dateValidation = validateDate(expense.date);
  if (!dateValidation.valid) errors.push(dateValidation.error);

  // Validate category exists
  if (!expense.category) errors.push('Categoria obrigatória');

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      amount: amountValidation.value,
      description: descValidation.value,
      date: dateValidation.value,
      category: expense.category,
      cardId: expense.cardId || null,
    }
  };
};

// Comprehensive category validation
export const validateCategory = (category, existingCategories) => {
  const errors = [];

  // Validate name
  const nameValidation = validateCategoryName(category.name);
  if (!nameValidation.valid) errors.push(nameValidation.error);

  // Check for duplicates
  if (nameValidation.valid && checkDuplicate(existingCategories, 'name', nameValidation.value)) {
    errors.push('Já existe uma categoria com este nome');
  }

  // Validate icon
  if (!category.icon) errors.push('Ícone obrigatório');

  // Validate color
  if (!category.color) errors.push('Cor obrigatória');

  // Validate limit
  const limitValidation = validateLimit(category.limit || 500);
  if (!limitValidation.valid) errors.push(limitValidation.error);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      name: nameValidation.value,
      icon: category.icon,
      color: category.color,
      limit: limitValidation.value,
    }
  };
};

// Comprehensive card validation
export const validateCard = (card) => {
  const errors = [];

  // Validate bank
  if (!card.bankId) errors.push('Banco obrigatório');

  // Validate name
  const nameValidation = validateCardName(card.customName || card.name);
  if (!nameValidation.valid) errors.push(nameValidation.error);

  // Validate limit
  const limitValidation = validateLimit(card.limit);
  if (!limitValidation.valid) errors.push(limitValidation.error);

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      ...card,
      customName: nameValidation.value,
      limit: limitValidation.value,
    }
  };
};
