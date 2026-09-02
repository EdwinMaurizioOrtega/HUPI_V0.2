import { colors } from '@/constants/colors';
import { IconButton } from './IconButton';

type NotificationBellProps = {
  compact?: boolean;
  count?: number;
  onPress?: () => void;
};

export function NotificationBell({ compact = false, count = 0, onPress }: NotificationBellProps) {
  return (
    <IconButton
      accessibilityLabel="__hupi_i18n:common.notifications"
      badge={count > 0 ? count : undefined}
      backgroundColor={colors.soft}
      icon="notifications-outline"
      iconColor={colors.text}
      iconSize={compact ? 21 : 23}
      onPress={onPress}
      size={compact ? 40 : 44}
    />
  );
}
