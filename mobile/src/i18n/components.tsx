import {
  Alert as NativeAlert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as NativePressable,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  View,
  type AlertButton,
  type AlertOptions,
  type KeyboardTypeOptions,
  type PressableProps,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ElementRef,
  type ReactNode,
} from 'react';
import { useTranslation } from '../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import {
  fonts,
  resolveFredokaFamily,
  typography,
  type TypographyVariant,
} from '@/constants/typography';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeTokens } from '@/theme/tokens';
import generatedSpanish from './generated/es.json';
import { getCurrentLanguage, i18n } from '.';

// The clean handoff excludes the audit-only reverse source map. The runtime
// lookup is derived from the required Spanish catalog with identical entries.
const sourceKeyMap = Object.fromEntries(
  Object.entries(generatedSpanish).map(([key, value]) => [value, key]),
) as Record<string, string>;
const translationTokenPrefix = '__hupi_i18n:';

function semanticTextOverrides(
  style: TextProps['style'] | TextInputProps['style'],
  tokens: ThemeTokens,
): TextStyle {
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};

  const overrides: TextStyle = {};
  if (flat.color === colors.text) {
    overrides.color = tokens.text;
  } else if (flat.color === colors.textMuted) {
    overrides.color = tokens.textMuted;
  } else if (flat.color === colors.primary || flat.color === colors.primaryDark) {
    overrides.color = tokens.primary;
  } else if (flat.color === colors.secondary) {
    overrides.color = tokens.secondary;
  } else if (flat.color === colors.success) {
    overrides.color = tokens.success;
  } else if (flat.color === colors.warning) {
    overrides.color = tokens.warning;
  } else if (flat.color === colors.danger) {
    overrides.color = tokens.danger;
  }

  if (flat.backgroundColor === colors.white || flat.backgroundColor === colors.surface) {
    overrides.backgroundColor = tokens.surfaceRaised;
  } else if (flat.backgroundColor === colors.soft) {
    overrides.backgroundColor = tokens.soft;
  } else if (flat.backgroundColor === colors.primarySoft) {
    overrides.backgroundColor = tokens.primarySoft;
  } else if (flat.backgroundColor === colors.secondarySoft) {
    overrides.backgroundColor = tokens.surfacePurple;
  } else if (
    flat.backgroundColor === colors.successSoft
    || flat.backgroundColor === colors.successSoftAlt
  ) {
    overrides.backgroundColor = tokens.successSoft;
  } else if (flat.backgroundColor === colors.warningSoft) {
    overrides.backgroundColor = tokens.warningSoft;
  }

  if (flat.borderColor === colors.border) {
    overrides.borderColor = tokens.border;
  }
  return overrides;
}

function semanticInputOverrides(
  style: TextInputProps['style'],
  tokens: ThemeTokens,
): TextStyle {
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};

  const overrides = semanticTextOverrides(style, tokens);
  if (
    flat.backgroundColor === colors.white
    || flat.backgroundColor === colors.surface
    || flat.backgroundColor === colors.soft
  ) {
    overrides.backgroundColor = tokens.inputPurple;
  }
  return overrides;
}

function fredokaOverrides(
  style: TextProps['style'] | TextInputProps['style'],
): TextStyle {
  const flat = StyleSheet.flatten(style);
  return {
    fontFamily: resolveFredokaFamily(flat?.fontWeight, flat?.fontFamily),
    includeFontPadding: true,
    // La variante real ya representa el peso; evita síntesis o fallback del sistema.
    fontWeight: undefined,
  };
}

function semanticViewOverrides(style: PressableProps['style'], tokens: ThemeTokens): ViewStyle {
  const flat = StyleSheet.flatten(typeof style === 'function' ? undefined : style);
  const overrides: ViewStyle = {};
  if (flat?.backgroundColor === colors.white || flat?.backgroundColor === colors.surface) {
    overrides.backgroundColor = tokens.surface;
  } else if (flat?.backgroundColor === colors.soft) {
    overrides.backgroundColor = tokens.soft;
  } else if (flat?.backgroundColor === colors.primarySoft) {
    overrides.backgroundColor = tokens.primarySoft;
  } else if (flat?.backgroundColor === colors.secondarySoft) {
    overrides.backgroundColor = tokens.surfacePurple;
  } else if (
    flat?.backgroundColor === colors.successSoft
    || flat?.backgroundColor === colors.successSoftAlt
  ) {
    overrides.backgroundColor = tokens.successSoft;
  } else if (flat?.backgroundColor === colors.warningSoft) {
    overrides.backgroundColor = tokens.warningSoft;
  }
  if (flat?.borderColor === colors.border) {
    overrides.borderColor = tokens.border;
  }
  return overrides;
}

function normalizeSource(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function translateVisibleText(value: string) {
  if (!value.trim()) {
    return value;
  }

  const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';
  const normalized = normalizeSource(value);
  const key = normalized.startsWith(translationTokenPrefix)
    ? normalized.slice(translationTokenPrefix.length)
    : sourceKeyMap[normalized];
  if (!key) {
    return value;
  }

  const translated = i18n.t(`generated.${key}` as never);
  return `${leadingWhitespace}${translated}${trailingWhitespace}`;
}

function translateNode(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    return translateVisibleText(node);
  }
  if (Array.isArray(node)) {
    return node.map(translateNode);
  }
  return node;
}

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
};

export const AppText = forwardRef<ElementRef<typeof NativeText>, AppTextProps>(function AppText(
  { children, variant = 'body', ...props },
  ref,
) {
  useTranslation();
  const { tokens } = useTheme();
  const combinedStyle = [typography[variant], props.style];
  return (
    <NativeText
      accessibilityLanguage={getCurrentLanguage()}
      ref={ref}
      {...props}
      style={[
        { color: tokens.text },
        combinedStyle,
        semanticTextOverrides(combinedStyle, tokens),
        fredokaOverrides(combinedStyle),
      ]}
    >
      {translateNode(children)}
    </NativeText>
  );
});

export const Text = AppText;

export const AppTextInput = forwardRef<ElementRef<typeof NativeTextInput>, TextInputProps>(function AppTextInput(
  {
    accessibilityHint,
    accessibilityLabel,
    cursorColor,
    placeholder,
    placeholderTextColor,
    selectionColor,
    ...props
  },
  ref,
) {
  useTranslation();
  const { tokens } = useTheme();
  const combinedStyle = [typography.body, props.style];
  const resolvedPlaceholderTextColor = placeholderTextColor === colors.textMuted
    ? tokens.placeholder
    : placeholderTextColor === colors.text
      ? tokens.text
      : placeholderTextColor ?? tokens.placeholder;
  return (
    <NativeTextInput
      accessibilityHint={accessibilityHint ? translateVisibleText(accessibilityHint) : undefined}
      accessibilityLabel={accessibilityLabel ? translateVisibleText(accessibilityLabel) : undefined}
      cursorColor={cursorColor ?? tokens.primary}
      placeholder={placeholder ? translateVisibleText(placeholder) : undefined}
      placeholderTextColor={resolvedPlaceholderTextColor}
      ref={ref}
      selectionColor={selectionColor ?? tokens.primary}
      {...props}
      style={[
        { color: tokens.text },
        combinedStyle,
        semanticTextOverrides(combinedStyle, tokens),
        semanticInputOverrides(combinedStyle, tokens),
        fredokaOverrides(combinedStyle),
      ]}
    />
  );
});

export const TextInput = AppTextInput;

export const Pressable = forwardRef<ElementRef<typeof NativePressable>, PressableProps>(function LocalizedPressable(
  { accessibilityHint, accessibilityLabel, ...props },
  ref,
) {
  useTranslation();
  const { tokens } = useTheme();
  const style = props.style;
  return (
    <NativePressable
      accessibilityHint={accessibilityHint ? translateVisibleText(accessibilityHint) : undefined}
      accessibilityLabel={accessibilityLabel ? translateVisibleText(accessibilityLabel) : undefined}
      ref={ref}
      {...props}
      style={typeof style === 'function'
        ? (state) => {
          const resolvedStyle = style(state);
          return [resolvedStyle, semanticViewOverrides(resolvedStyle, tokens)];
        }
        : [style, semanticViewOverrides(style, tokens)]}
    />
  );
});

function translateButtons(buttons?: AlertButton[]) {
  return buttons?.map((button) => ({
    ...button,
    text: button.text ? translateVisibleText(button.text) : button.text,
  }));
}

export type LocalizedPromptOptions = {
  acceptText?: string;
  cancelText?: string;
  defaultValue?: string;
  keyboardType?: KeyboardTypeOptions;
  message?: string;
  onAccept: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  title: string;
  validate?: (value: string) => string | undefined;
};

type TranslatedPromptOptions = Omit<LocalizedPromptOptions, 'validate'> & {
  validate?: (value: string) => string | undefined;
};

type PromptPresenter = (request: TranslatedPromptOptions) => void;

let promptPresenter: PromptPresenter | null = null;
const pendingPrompts: TranslatedPromptOptions[] = [];

function translatePromptOptions(options: LocalizedPromptOptions): TranslatedPromptOptions {
  return {
    ...options,
    acceptText: translateVisibleText(options.acceptText ?? i18n.t('common.confirm')),
    cancelText: translateVisibleText(options.cancelText ?? i18n.t('common.cancel')),
    message: options.message ? translateVisibleText(options.message) : undefined,
    placeholder: options.placeholder ? translateVisibleText(options.placeholder) : undefined,
    title: translateVisibleText(options.title),
    validate: options.validate
      ? (value) => {
        const validationMessage = options.validate?.(value);
        return validationMessage ? translateVisibleText(validationMessage) : undefined;
      }
      : undefined,
  };
}

function enqueuePrompt(request: TranslatedPromptOptions) {
  if (promptPresenter) {
    promptPresenter(request);
    return;
  }
  pendingPrompts.push(request);
}

function showNativeIosPrompt(request: TranslatedPromptOptions) {
  if (Platform.OS !== 'ios' || typeof NativeAlert.prompt !== 'function') {
    return false;
  }

  // El prompt del sistema no admite placeholder ni validación en línea.
  // En esos casos usamos el modal común para conservar la experiencia completa.
  if (request.placeholder || request.validate) {
    return false;
  }

  NativeAlert.prompt(
    request.title,
    request.message,
    [
      {
        onPress: request.onCancel,
        style: 'cancel',
        text: request.cancelText,
      },
      {
        isPreferred: true,
        onPress: (value?: string) => request.onAccept(value ?? ''),
        text: request.acceptText,
      },
    ],
    request.secureTextEntry ? 'secure-text' : 'plain-text',
    request.defaultValue,
    request.keyboardType,
  );
  return true;
}

export const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    NativeAlert.alert(
      translateVisibleText(title),
      message ? translateVisibleText(message) : undefined,
      translateButtons(buttons),
      options,
    );
  },
  prompt(options: LocalizedPromptOptions) {
    const translatedOptions = translatePromptOptions(options);
    if (!showNativeIosPrompt(translatedOptions)) {
      enqueuePrompt(translatedOptions);
    }
  },
};

export function LocalizedPromptHost() {
  const { tokens } = useTheme();
  const requestRef = useRef<TranslatedPromptOptions | null>(null);
  const [request, setRequest] = useState<TranslatedPromptOptions | null>(null);
  const [value, setValue] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const present = (nextRequest: TranslatedPromptOptions) => {
    if (requestRef.current) {
      pendingPrompts.push(nextRequest);
      return;
    }
    requestRef.current = nextRequest;
    setValue(nextRequest.defaultValue ?? '');
    setValidationMessage(null);
    setRequest(nextRequest);
  };

  useEffect(() => {
    promptPresenter = present;
    const queued = pendingPrompts.splice(0);
    queued.forEach(present);

    return () => {
      promptPresenter = null;
      if (requestRef.current) {
        pendingPrompts.unshift(requestRef.current);
        requestRef.current = null;
      }
    };
  }, []);

  const finish = () => {
    requestRef.current = null;
    setRequest(null);
    setValidationMessage(null);
    const nextRequest = pendingPrompts.shift();
    if (nextRequest) {
      present(nextRequest);
    }
  };

  const cancel = () => {
    request?.onCancel?.();
    finish();
  };

  const accept = () => {
    if (!request) return;
    const error = request.validate?.(value);
    if (error) {
      setValidationMessage(error);
      return;
    }
    request.onAccept(value);
    finish();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={cancel}
      transparent
      visible={Boolean(request)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={promptStyles.overlay}
      >
        <View
          accessibilityLabel={request?.title}
          accessibilityRole="alert"
          style={[promptStyles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
        >
          <NativeText style={[promptStyles.title, { color: tokens.text }]}>
            {request?.title}
          </NativeText>
          {request?.message ? (
            <NativeText style={[promptStyles.message, { color: tokens.textMuted }]}>
              {request.message}
            </NativeText>
          ) : null}
          <NativeTextInput
            accessibilityLabel={request?.placeholder ?? request?.title}
            autoFocus
            keyboardType={request?.keyboardType}
            onChangeText={(nextValue) => {
              setValue(nextValue);
              if (validationMessage) setValidationMessage(null);
            }}
            onSubmitEditing={accept}
            placeholder={request?.placeholder}
            placeholderTextColor={tokens.placeholder}
            secureTextEntry={request?.secureTextEntry}
            style={[
              promptStyles.input,
              { backgroundColor: tokens.input, borderColor: tokens.border, color: tokens.text },
            ]}
            value={value}
          />
          {validationMessage ? (
            <NativeText accessibilityLiveRegion="polite" style={promptStyles.validation}>
              {validationMessage}
            </NativeText>
          ) : null}
          <View style={promptStyles.actions}>
            <NativePressable
              accessibilityRole="button"
              onPress={cancel}
              style={[promptStyles.button, { backgroundColor: tokens.soft }]}
            >
              <NativeText style={[promptStyles.cancelText, { color: tokens.text }]}>
                {request?.cancelText}
              </NativeText>
            </NativePressable>
            <NativePressable
              accessibilityRole="button"
              onPress={accept}
              style={[promptStyles.button, promptStyles.acceptButton]}
            >
              <NativeText style={promptStyles.acceptText}>{request?.acceptText}</NativeText>
            </NativePressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const promptStyles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 17, 24, 0.56)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 25,
  },
  message: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  validation: {
    color: colors.danger,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  button: {
    alignItems: 'center',
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  cancelButton: { backgroundColor: colors.soft },
  acceptButton: { backgroundColor: colors.primary },
  cancelText: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  acceptText: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
});
