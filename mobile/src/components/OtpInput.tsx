import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { useRef, useState } from 'react';
import {
  StyleSheet,
  type TextInput as NativeTextInput,
} from 'react-native';

import { fonts } from '@/constants/typography';
import { Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

const OTP_LENGTH = 6;

type OtpInputProps = {
  accessibilityLabel: string;
  onChangeText: (value: string) => void;
  value: string;
};

export function OtpInput({
  accessibilityLabel,
  onChangeText,
  value,
}: OtpInputProps) {
  const inputRef = useRef<NativeTextInput>(null);
  const [focused, setFocused] = useState(false);
  const { tokens } = useTheme();
  const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
  const activeIndex = Math.min(digits.length, OTP_LENGTH - 1);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
      accessibilityValue={{ text: digits }}
      onPress={() => inputRef.current?.focus()}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.slots}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = digits[index];
          const active = focused && index === activeIndex;

          return (
            <View
              key={index}
              style={[
                styles.slot,
                {
                  backgroundColor: tokens.inputPurple,
                  borderColor: active ? tokens.primary : tokens.border,
                },
              ]}
            >
              <Text
                maxFontSizeMultiplier={1.15}
                style={[
                  styles.digit,
                  { color: digit ? tokens.text : tokens.placeholder },
                ]}
              >
                {digit ?? '0'}
              </Text>
              {active ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.cursor, { backgroundColor: tokens.primary }]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        autoComplete="one-time-code"
        caretHidden
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        onBlur={() => setFocused(false)}
        onChangeText={(nextValue) => onChangeText(
          nextValue.replace(/\D/g, '').slice(0, OTP_LENGTH),
        )}
        onFocus={() => setFocused(true)}
        style={styles.nativeInput}
        textContentType="oneTimeCode"
        value={digits}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 66,
    position: 'relative',
    width: '100%',
  },
  slots: {
    flexDirection: 'row',
    gap: 7,
    width: '100%',
  },
  slot: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 66,
    justifyContent: 'center',
    minWidth: 0,
    position: 'relative',
  },
  digit: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: 'center',
  },
  cursor: {
    borderRadius: 1,
    height: 28,
    position: 'absolute',
    right: 6,
    width: 2,
  },
  nativeInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    opacity: 0.01,
    padding: 0,
  },
});
