// /src/components/Forms.js
// Consolidates: Input, Select, DatePicker, CurrencyInput, SearchBar, Toggle, TextArea

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Keyboard,
} from 'react-native';
//import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { formatCurrency, unformatCurrency } from '../utils/ValidationUtils';
import { formatDateShort, parseDate } from '../utils/ValidationUtils';
import { triggerHaptic } from '../utils/InteractionManagerPatch';

// ═══════════════════════════════════════════════════════════
// SHARED STYLES & HELPERS
// ═══════════════════════════════════════════════════════════

const useFormStyles = () => {
  const { theme, isDark } = useTheme();

  return {
    theme,
    isDark,
    colors: theme.colors,
    styles: StyleSheet.create({
      // ─── Container ───
      fieldContainer: {
        marginBottom: 16,
      },
      fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
      },
      fieldLabelRequired: {
        color: theme.colors.danger,
      },
      fieldError: {
        fontSize: 12,
        color: theme.colors.danger,
        marginTop: 4,
      },
      fieldHelper: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
      },

      // ─── Input ───
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
        paddingHorizontal: 14,
        minHeight: 50,
      },
      inputContainerFocused: {
        borderColor: theme.colors.primary,
        backgroundColor: isDark ? '#1C1C1E' : '#FFF',
        ...theme.shadows.small,
      },
      inputContainerError: {
        borderColor: theme.colors.danger,
      },
      inputContainerDisabled: {
        opacity: 0.5,
      },
      input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        paddingVertical: 12,
      },
      inputIcon: {
        fontSize: 18,
        marginRight: 10,
        color: theme.colors.textSecondary,
      },
      inputIconRight: {
        marginRight: 0,
        marginLeft: 10,
      },
      inputClear: {
        padding: 4,
      },

      // ─── Select ───
      selectValue: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        paddingVertical: 12,
      },
      selectPlaceholder: {
        color: theme.colors.textSecondary,
      },
      selectChevron: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 8,
      },

      // ─── Dropdown ───
      dropdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 100,
      },
      dropdown: {
        position: 'absolute',
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        ...theme.shadows.large,
        maxHeight: 250,
        zIndex: 101,
      },
      dropdownItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#333' : '#F2F2F7',
      },
      dropdownItemSelected: {
        backgroundColor: theme.colors.primary + '10',
      },
      dropdownItemText: {
        fontSize: 16,
        color: theme.colors.text,
      },
      dropdownItemTextSelected: {
        color: theme.colors.primary,
        fontWeight: '600',
      },

      // ─── Toggle ───
      toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      toggleTrack: {
        width: 52,
        height: 32,
        borderRadius: 16,
        padding: 2,
        justifyContent: 'center',
      },
      toggleTrackOn: {
        backgroundColor: theme.colors.primary,
      },
      toggleTrackOff: {
        backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
      },
      toggleThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFF',
        ...theme.shadows.small,
      },

      // ─── TextArea ───
      textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
      },

      // ─── SearchBar ───
      searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        marginHorizontal: 16,
        marginBottom: 12,
      },
      searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        marginLeft: 8,
        paddingVertical: 8,
      },
      searchClear: {
        padding: 4,
      },

      // ─── Currency ───
      currencyPrefix: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginRight: 4,
      },
    }),
  };
};

// ═══════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  helper,
  icon,
  iconRight,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
  multiline = false,
  numberOfLines,
  autoFocus = false,
  returnKeyType = 'done',
  onSubmitEditing,
  blurOnSubmit = true,
  required = false,
  style,
  inputStyle,
  testID,
}) => {
  const { colors, styles } = useFormStyles();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    onChangeText?.('');
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      {label && (
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.fieldLabelRequired}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
          multiline && { alignItems: 'flex-start', minHeight: multiline ? 80 : 50 },
        ]}
      >
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.textArea,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          testID={testID}
        />
        {iconRight && <Text style={[styles.inputIcon, styles.inputIconRight]}>{iconRight}</Text>}
        {value?.length > 0 && editable && (
          <TouchableOpacity style={styles.inputClear} onPress={handleClear}>
            <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : helper ? (
        <Text style={styles.fieldHelper}>{helper}</Text>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// CURRENCY INPUT
// ═══════════════════════════════════════════════════════════

export const CurrencyInput = ({
  label,
  value,
  onChangeValue,
  placeholder = '0,00',
  prefix = 'R$',
  error,
  helper,
  editable = true,
  required = false,
  style,
}) => {
  const { colors, styles } = useFormStyles();
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ? formatCurrency(value, false) : '');

  const handleChangeText = (text) => {
    const numeric = unformatCurrency(text);
    const formatted = formatCurrency(numeric, false);
    setDisplayValue(formatted);
    onChangeValue?.(numeric);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (displayValue === '0,00') setDisplayValue('');
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue || displayValue === '') {
      setDisplayValue('0,00');
    }
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      {label && (
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.fieldLabelRequired}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        <Text style={styles.currencyPrefix}>{prefix}</Text>
        <TextInput
          style={styles.input}
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          editable={editable}
          selectTextOnFocus
        />
      </View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : helper ? (
        <Text style={styles.fieldHelper}>{helper}</Text>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════

export const Select = ({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Selecione...',
  error,
  helper,
  required = false,
  disabled = false,
  style,
  keyExtractor = (item) => item.id || item.value || item,
  labelExtractor = (item) => item.label || item.name || item,
  valueExtractor = (item) => item.value || item.id || item,
}) => {
  const { colors, styles } = useFormStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [layout, setLayout] = useState(null);

  const selectedOption = options.find(
    (opt) => valueExtractor(opt) === value
  );

  const handleSelect = (option) => {
    triggerHaptic('light');
    onSelect?.(valueExtractor(option));
    setIsOpen(false);
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      {label && (
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.fieldLabelRequired}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => !disabled && setIsOpen(true)}
        onLayout={(e) => setLayout(e.nativeEvent.layout)}
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Text
          style={[
            styles.selectValue,
            !selectedOption && styles.selectPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? labelExtractor(selectedOption) : placeholder}
        </Text>
        <Text style={styles.selectChevron}>▼</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : helper ? (
        <Text style={styles.fieldHelper}>{helper}</Text>
      ) : null}

      {isOpen && (
        <>
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View
            style={[
              styles.dropdown,
              {
                top: (layout?.y || 0) + (layout?.height || 0) + 4,
                left: layout?.x || 0,
                width: layout?.width || '100%',
              },
            ]}
          >
            {options.map((option, index) => {
              const isSelected = valueExtractor(option) === value;
              return (
                <TouchableOpacity
                  key={keyExtractor(option) || index}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      isSelected && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {labelExtractor(option)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// DATE PICKER (COMENTADO - descomente se tiver @react-native-community/datetimepicker)
// ═══════════════════════════════════════════════════════════

/*export const DatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Selecione a data',
  minimumDate,
  maximumDate,
  mode = 'date',
  error,
  helper,
  required = false,
  disabled = false,
  style,
}) => {
  const { colors, styles } = useFormStyles();
  const { t } = useI18n();
  const [showPicker, setShowPicker] = useState(false);

  const dateValue = value ? (value instanceof Date ? value : parseDate(value)) : null;

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange?.(selectedDate);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      triggerHaptic('light');
      setShowPicker(true);
    }
  };

  return (
    <View style={[styles.fieldContainer, style]}>
      {label && (
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.fieldLabelRequired}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.inputContainer,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        <Text style={styles.inputIcon}>📅</Text>
        <Text
          style={[
            styles.selectValue,
            !dateValue && styles.selectPlaceholder,
          ]}
        >
          {dateValue ? formatDateShort(dateValue) : placeholder}
        </Text>
        <Text style={[styles.inputIcon, styles.inputIconRight]}>▾</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : helper ? (
        <Text style={styles.fieldHelper}>{helper}</Text>
      ) : null}

      {showPicker && (
        <DateTimePicker
          value={dateValue || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale="pt-BR"
        />
      )}
    </View>
  );
};*/

// ═══════════════════════════════════════════════════════════
// TOGGLE / SWITCH
// ═══════════════════════════════════════════════════════════

export const Toggle = ({
  label,
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const { colors, styles } = useFormStyles();
  const [translateX] = useState(new Animated.Value(value ? 20 : 0));

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 20 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (!disabled) {
      triggerHaptic('light');
      onValueChange?.(!value);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.toggleContainer, style]}
      disabled={disabled}
    >
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View
        style={[
          styles.toggleTrack,
          value ? styles.toggleTrackOn : styles.toggleTrackOff,
          disabled && { opacity: 0.4 },
        ]}
      >
        <Animated.View
          style={[
            styles.toggleThumb,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════
// SEARCH BAR
// ═══════════════════════════════════════════════════════════

export const SearchBar = ({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  autoFocus = false,
  style,
}) => {
  const { colors, styles } = useFormStyles();
  const { t } = useI18n();

  const handleClear = () => {
    onChangeText?.('');
  };

  return (
    <View style={[styles.searchContainer, style]}>
      <Text style={{ fontSize: 16, color: colors.textSecondary }}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('common.search')}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        autoCapitalize="none"
      />
      {value?.length > 0 && (
        <TouchableOpacity style={styles.searchClear} onPress={handleClear}>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════
// TEXT AREA
// ═══════════════════════════════════════════════════════════

export const TextArea = ({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength = 500,
  numberOfLines = 4,
  error,
  helper,
  required = false,
  style,
}) => {
  const { colors, styles } = useFormStyles();

  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
      numberOfLines={numberOfLines}
      maxLength={maxLength}
      error={error}
      helper={helper || `${value?.length || 0}/${maxLength}`}
      required={required}
      style={style}
      returnKeyType="default"
      blurOnSubmit={false}
    />
  );
};

// ═══════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════

export default {
  Input,
  CurrencyInput,
  Select,
  Toggle,
  SearchBar,
  TextArea,
};