

import { fonts, typography } from '@/constants/typography';
import { Text, TextInput } from '@/i18n/components';

type ComponentWithDefaultProps = {
  defaultProps?: {
    allowFontScaling?: boolean;
    style?: unknown;
  };
};

let configured = false;

export function configureGlobalTypography() {
  if (configured) {
    return;
  }

  const textComponent = Text as unknown as ComponentWithDefaultProps;
  const textInputComponent = TextInput as unknown as ComponentWithDefaultProps;

  textComponent.defaultProps = textComponent.defaultProps ?? {};
  textComponent.defaultProps.style = [
    { fontFamily: fonts.regular, fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
    textComponent.defaultProps.style,
  ];

  textInputComponent.defaultProps = textInputComponent.defaultProps ?? {};
  textInputComponent.defaultProps.style = [
    { fontFamily: fonts.regular, fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
    textInputComponent.defaultProps.style,
  ];

  configured = true;
}
