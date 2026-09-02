import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import {
  StyleSheet,
} from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import type { ProfileAvatarType } from '@/constants/defaultProfileImages';
import { theme } from '@/constants/theme';
import { Text } from '@/i18n/components';

type ChatCardProps = {
  accentColor: string;
  avatarType?: ProfileAvatarType;
  lastMessage: string;
  onPress: () => void;
  relation: string;
  title: string;
  status: string;
  time: string;
  unread: number;
  uri?: string;
};

export function ChatCard({
  accentColor,
  avatarType = 'provider',
  lastMessage,
  onPress,
  relation,
  title,
  status,
  time,
  unread,
  uri,
}: ChatCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ProfileAvatar size={52} style={styles.avatar} type={avatarType} uri={uri} />

      <View style={styles.copy}>
        <View style={styles.topRow}>
          <View style={styles.titleCopy}>
            <Text numberOfLines={1} style={styles.providerName}>{title}</Text>
            <Text style={styles.serviceText}>{relation}</Text>
          </View>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
          <Text style={styles.statusText}>{status}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text numberOfLines={2} style={styles.preview}>{lastMessage}</Text>
          <View style={styles.actions}>
            {unread > 0 ? (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{unread} {unread === 1 ? 'mensaje' : 'mensajes'}</Text>
              </View>
            ) : null}
            <Ionicons color={colors.primary} name="chevron-forward" size={20} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 142,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    ...theme.shadow,
    shadowOpacity: 0.06,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  topRow: { flexDirection: 'row', gap: 8 },
  titleCopy: { flex: 1 },
  providerName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  serviceText: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 3 },
  time: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  statusPill: {
    alignSelf: 'flex-start',
    minHeight: 27,
    borderRadius: 999,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    marginTop: 11,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 11 },
  preview: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 21 },
  actions: { alignItems: 'center', gap: 8 },
  unread: {
    minWidth: 68,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  unreadText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
