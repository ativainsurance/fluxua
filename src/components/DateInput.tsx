import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTranslation } from 'react-i18next';
import { typography, spacing, radius } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** ISO 'YYYY-MM-DD' → display 'MM/DD/YYYY' */
const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

/** Display 'MM/DD/YYYY' → ISO 'YYYY-MM-DD', or null if invalid */
const displayToIso = (display: string): string | null => {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map((p) => parseInt(p, 10));
  if ([m, d, y].some(isNaN)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2099) return null;
  // Validate actual day count (e.g., Feb 31 is invalid)
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/** ISO → Date object at local midnight (avoids timezone shift) */
const isoToDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Date → ISO */
const dateToIso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Auto-insert slashes as user types digits */
const autoFormat = (raw: string, prev: string): string => {
  // Only auto-insert when user is adding characters
  if (raw.length < prev.length) return raw;

  // Strip everything except digits and slashes
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 0) return '';

  let result = digits;
  if (digits.length >= 3) result = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length >= 5) result = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  return result;
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface Props {
  value: string;           // ISO 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: string;    // ISO
  optional?: boolean;
  error?: string;
}

export const DateInput = ({
  value,
  onChange,
  placeholder,
  minimumDate,
  optional = false,
  error }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('dateInput.placeholder');
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [displayText, setDisplayText] = useState(isoToDisplay(value));
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const prevText = useRef(displayText);

  // Keep display in sync when the value prop changes externally
  useEffect(() => {
    const display = isoToDisplay(value);
    setDisplayText(display);
    prevText.current = display;
    setHasError(false);
  }, [value]);

  const handleTextChange = (raw: string) => {
    const formatted = autoFormat(raw, prevText.current);
    prevText.current = formatted;
    setDisplayText(formatted);
    setHasError(false);

    // Try to resolve a complete date (10 chars = MM/DD/YYYY)
    if (formatted.length === 10) {
      const iso = displayToIso(formatted);
      if (iso) {
        onChange(iso);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } else if (formatted === '' && optional) {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayText === '' && optional) {
      onChange('');
      setHasError(false);
      return;
    }
    if (displayText.length > 0 && displayText.length < 10) {
      setHasError(true);
      return;
    }
    const iso = displayToIso(displayText);
    if (iso) {
      onChange(iso);
      setHasError(false);
      setDisplayText(isoToDisplay(iso)); // normalize display
    } else if (displayText.length > 0) {
      setHasError(true);
    }
  };

  const handlePickerConfirm = (date: Date) => {
    const iso = dateToIso(date);
    onChange(iso);
    setDisplayText(isoToDisplay(iso));
    setHasError(false);
    setPickerVisible(false);
  };

  const pickerDate = value ? isoToDate(value) : new Date();
  const minDate = minimumDate ? isoToDate(minimumDate) : undefined;

  const borderColor = hasError
    ? colors.danger
    : displayText.length === 10 && !hasError
    ? colors.success
    : colors.border;

  return (
    <View>
      <View style={[styles.container, { borderColor }]}>
        {/* Calendar trigger */}
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => setPickerVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={value ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={styles.input}
          value={displayText}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          maxLength={10}
          returnKeyType="done"
        />

        {/* Clear button */}
        {optional && value && (
          <TouchableOpacity
            onPress={() => {
              onChange('');
              setDisplayText('');
              setHasError(false);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
          </TouchableOpacity>
        )}

        {/* Valid checkmark */}
        {!hasError && value && !optional && (
          <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.validIcon} />
        )}
      </View>

      {hasError && (
        <Text style={styles.errorText}>
          {t('dateInput.errorInvalidFormat')}
        </Text>
      )}

      <Text style={styles.hint}>
        {t('dateInput.hint')}
      </Text>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="date"
        date={pickerDate}
        minimumDate={minDate}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 2 : spacing.xs + 2,
    gap: spacing.xs },
  calendarBtn: {
    padding: 2 },
  input: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textPrimary,
    paddingVertical: 0 },
  validIcon: {
    marginLeft: 2 },
  errorText: {
    fontSize: typography.xs,
    color: colors.danger,
    marginTop: spacing.xs },
  hint: {
    fontSize: typography.xs,
    color: colors.textDisabled,
    marginTop: 4 } });
