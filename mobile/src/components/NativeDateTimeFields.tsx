import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import DateTimePicker,
  {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
  } from '@react-native-community/datetimepicker';
import { useEffect,
  useRef,
  useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { getCurrentLocale, i18n } from '@/i18n';
import { Pressable, Text } from '@/i18n/components';
import { formatDate, formatTime } from '@/i18n/format';
import { useTranslation } from '../../node_modules/react-i18next';
import { useTheme } from '@/theme/ThemeProvider';

type NativeDateTimeModalProps = {
  errorMessage?: string | null;
  minimumDate?: Date;
  mode: 'date' | 'time';
  onCancel: () => void;
  onConfirm: (value: Date) => void;
  onValueChange?: (value: Date) => void;
  title: string;
  value: Date;
  visible: boolean;
};

type NativeDatePickerFieldProps = {
  containerStyle?: object;
  label: string;
  minimumDate: Date;
  onConfirm: (date: Date) => void;
  value: Date | null;
};

type NativeTimePickerFieldProps = {
  containerStyle?: object;
  label: string;
  onConfirm: (date: Date) => boolean;
  onInvalid?: (message: string) => void;
  value: Date | null;
};

export function formatNativeDate(date: Date | null) {
  if (!date) {
    return i18n.t('common.selectDate');
  }
  return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatNativeTime(date: Date | null) {
  if (!date) {
    return i18n.t('common.selectTime');
  }
  return formatTime(date);
}

function normalizeDate(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function NativeDateTimeModal({
  errorMessage,
  minimumDate,
  mode,
  onCancel,
  onConfirm,
  onValueChange,
  title,
  value,
  visible,
}: NativeDateTimeModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { resolvedTheme, tokens } = useTheme();
  const [temporaryValue, setTemporaryValue] = useState(value);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);

  onCancelRef.current = onCancel;
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (visible) {
      setTemporaryValue(value);
    }
  }, [value, visible]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !visible) {
      return;
    }

    const actionColor = tokens.primary;
    DateTimePickerAndroid.open({
      display: mode === 'date' ? 'calendar' : 'default',
      minimumDate: mode === 'date' ? minimumDate : undefined,
      mode,
      negativeButton: { label: t('common.cancel'), textColor: actionColor },
      onChange: (event: DateTimePickerEvent, selectedValue?: Date) => {
        if (event.type === 'dismissed' || !selectedValue) {
          onCancelRef.current();
          return;
        }
        onConfirmRef.current(mode === 'date' ? normalizeDate(selectedValue) : selectedValue);
      },
      positiveButton: { label: t('common.done'), textColor: actionColor },
      value,
    });
  }, [minimumDate, mode, t, tokens.primary, value, visible]);

  if (Platform.OS === 'android') {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={[styles.backdrop, { backgroundColor: tokens.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: tokens.surface, paddingBottom: Math.max(insets.bottom, 18) },
          ]}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: tokens.border }]}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: tokens.textMuted }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Text numberOfLines={2} style={[styles.sheetTitle, { color: tokens.text }]}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onConfirm(mode === 'date' ? normalizeDate(temporaryValue) : temporaryValue)}
              style={styles.headerButton}
            >
              <Text style={[styles.doneText, { color: tokens.primary }]}>{t('common.done')}</Text>
            </Pressable>
          </View>
          <View style={[styles.pickerBody, mode === 'time' ? styles.timePickerBody : styles.datePickerBody]}>
            <DateTimePicker
              accentColor={tokens.primary}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale={getCurrentLocale()}
              minimumDate={mode === 'date' ? minimumDate : undefined}
              mode={mode}
              onChange={(_, selectedValue) => {
                if (selectedValue) {
                  setTemporaryValue(selectedValue);
                  onValueChange?.(selectedValue);
                }
              }}
              style={[
                mode === 'time' ? styles.timePicker : styles.datePicker,
                { backgroundColor: tokens.surface },
              ]}
              textColor={tokens.text}
              themeVariant={resolvedTheme}
              value={temporaryValue}
            />
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function NativeDatePickerField({
  containerStyle,
  label,
  minimumDate,
  onConfirm,
  value,
}: NativeDatePickerFieldProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const pickerValue = value ?? minimumDate;

  return (
    <>
      <ReadonlyField
        containerStyle={containerStyle}
        icon="calendar-outline"
        label={label}
        onPress={() => setModalVisible(true)}
        value={formatNativeDate(value)}
      />
      <NativeDateTimeModal
        minimumDate={minimumDate}
        mode="date"
        onCancel={() => setModalVisible(false)}
        onConfirm={(selectedDate) => {
          onConfirm(selectedDate);
          setModalVisible(false);
        }}
        title={t('common.selectDate')}
        value={pickerValue}
        visible={modalVisible}
      />
    </>
  );
}

export function NativeTimePickerField({
  containerStyle,
  label,
  onConfirm,
  onInvalid,
  value,
}: NativeTimePickerFieldProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackValue, setFallbackValue] = useState(() => new Date());
  const pickerValue = value ?? fallbackValue;

  const confirm = (time: Date) => {
    const valid = onConfirm(time);
    if (!valid) {
      const message = t('common.selectFutureTime');
      setError(message);
      onInvalid?.(message);
      if (Platform.OS === 'android') {
        setModalVisible(false);
      }
      return;
    }
    setError(null);
    setModalVisible(false);
  };

  return (
    <>
      <ReadonlyField
        containerStyle={containerStyle}
        icon="time-outline"
        label={label}
        onPress={() => {
          setError(null);
          if (!value) {
            setFallbackValue(new Date());
          }
          setModalVisible(true);
        }}
        value={formatNativeTime(value)}
      />
      <NativeDateTimeModal
        errorMessage={error}
        mode="time"
        onCancel={() => {
          setError(null);
          setModalVisible(false);
        }}
        onConfirm={confirm}
        onValueChange={() => setError(null)}
        title={t('common.selectTime')}
        value={pickerValue}
        visible={modalVisible}
      />
    </>
  );
}

function ReadonlyField({
  containerStyle,
  icon,
  label,
  onPress,
  value,
}: {
  containerStyle?: object;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  value: string;
}) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.readonlyWrapper, containerStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[
          styles.readonlyShell,
          { backgroundColor: tokens.input, borderColor: tokens.border },
        ]}
      >
        <Ionicons color={tokens.textMuted} name={icon} size={19} />
        <Text numberOfLines={2} style={[styles.readonlyValue, { color: tokens.text }]}>{value}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  readonlyWrapper: { gap: 7 },
  inputLabel: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  readonlyShell: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  readonlyValue: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingHorizontal: 14,
  },
  sheetHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: { width: 76, minHeight: 44, justifyContent: 'center' },
  cancelText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  doneText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', textAlign: 'right' },
  sheetTitle: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  pickerBody: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  datePickerBody: { minHeight: 340, paddingVertical: 8 },
  timePickerBody: { minHeight: 236, paddingTop: 4 },
  datePicker: { width: '100%', height: 330 },
  timePicker: { width: '100%', height: 228, backgroundColor: colors.white },
  errorText: { color: colors.danger, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', paddingBottom: 8, textAlign: 'center' },
});
