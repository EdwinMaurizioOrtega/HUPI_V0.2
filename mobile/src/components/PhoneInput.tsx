import type { TextInputProps } from 'react-native';

import { PhoneCountryInput } from '@/components/PhoneCountryInput';

type PhoneInputProps = Omit<TextInputProps, 'keyboardType'> & {
  label?: string;
};

export function PhoneInput({ label = 'Teléfono', onChangeText, value, ...props }: PhoneInputProps) {
  return (
    <PhoneCountryInput
      countryCode="+593"
      countryLocked
      label={label}
      onCountryChange={() => undefined}
      onPhoneChange={(nextPhone) => onChangeText?.(nextPhone)}
      phone={String(value ?? '')}
      {...props}
    />
  );
}
